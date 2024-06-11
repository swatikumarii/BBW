'use strict';

/**
 * @namespace Cart
 */

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var BasketMgr = require('dw/order/BasketMgr');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
var CartModel = require('*/cartridge/models/cart');
var HashMap = require('dw/util/HashMap');
var Template = require('dw/util/Template');
var cartTemplate = new Template('cart/productCard/cartProductCardAjax');
var miniCartTemplate = new Template('checkout/productCard/miniCartProductCardAjax');
var dynamicBadgeHelpers = require('*/cartridge/scripts/helpers/dynamicBadgeHelpers');
var Site = require('dw/system/Site');

/**
 * Cart-AddCoupon : The Cart-AddCoupon endpoint is responsible for adding a coupon to a basket
 * querystringparameters are:
 * couponCode - the coupon code to be applied
 * csrf_token - hidden input field csrf token
 * Middlewares used: server.middleware.https, and csrfProtection.validateAjaxRequest
 * This is a sensitive category function and uses Get Method
 * @name Cart-AddCoupon
 * @function
 * @memberof Cart
 * @returns {object} - json
 */
server.replace(
    'AddCoupon',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Resource = require('dw/web/Resource');
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

        var currentBasket = BasketMgr.getCurrentBasket();

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({
                error: true,
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });

            return next();
        }

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({
                errorMessage: Resource.msg('error.add.coupon', 'cart', null)
            });
            return next();
        }

        var error = false;
        var errorMessage;

        try {
            Transaction.wrap(function () {
                return currentBasket.createCouponLineItem(
                    req.querystring.couponCode,
                    true
                );
            });
        } catch (e) {
            error = true;
            errorMessage = cartHelper.checkCouponCodeError(
                req.querystring.couponCode, e.errorCode
            );
        }

        if (error) {
            res.json({
                error: error,
                errorMessage: errorMessage
            });
            return next();
        }

        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        var basketModel = new CartModel(currentBasket);

        res.json(basketModel);
        return next();
    }
);

server.append('UpdateQuantity', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();
    var changes = cartHelper.createFreeLineItem(currentBasket, 0);
    if (!viewData.errorMessage) {
        var basketModel = new CartModel(currentBasket);
        if (viewData.items.length !== basketModel.items.length || changes) {
            basketModel.refreshItems = true;
            var context = new HashMap();
            Object.keys(basketModel).forEach(function (key) {
                context.put(key, basketModel[key]);
            });
            basketModel.refreshItemsTemplate =
                cartTemplate.render(context).text;
            basketModel.refreshItemsTemplateMinicart =
                miniCartTemplate.render(context).text;
        }
        if (
            req.currentCustomer &&
            req.currentCustomer.raw &&
            req.currentCustomer.raw.profile
        ) {
            dynamicBadgeHelpers.updateCartDetailInProfile(
                req.currentCustomer.raw.profile
            );
        }
        res.setViewData(basketModel);
    }
    next();
});

server.append('RemoveProductLineItem', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var changes = cartHelper.createFreeLineItem(currentBasket, 0);
    var viewData = res.getViewData();
    var basketModel = new CartModel(currentBasket);
    if (changes) {
        viewData.refreshItems = true;
        var context = new HashMap();
        Object.keys(basketModel).forEach(function (key) {
            context.put(key, basketModel[key]);
        });
        viewData.refreshItemsTemplate =
            cartTemplate.render(context).text;
        viewData.refreshItemsTemplateMinicart =
            miniCartTemplate.render(context).text;
    }
    if (
        req.currentCustomer &&
        req.currentCustomer.raw &&
        req.currentCustomer.raw.profile
    ) {
        dynamicBadgeHelpers.updateCartDetailInProfile(
            req.currentCustomer.raw.profile
        );
    }
    // free item count
    viewData.basket.freeItemCount = basketModel.freeItemCount;
    viewData.basket.freeItemToastMessage = basketModel.freeItemToastMessage;
    res.setViewData(viewData);

    next();
});


/**
 * Cart-AddProduct : The Cart-AddProduct endpoint check product price and retrun if price is zero
 * @name Cart-AddProduct
 */
server.prepend('AddProduct', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var price = cartHelper.getProductPrice(req.form.pid);
    if (price === 0) {
        res.json({
            error: true,
            errorCode: 'ZERO-PRICE-PRODUCT',
            errorMessage: Resource.msg(
                'error.can.not.add.zero.price.item',
                'product',
                null
            )
        });
        return this.emit('route:Complete', req, res);
    }
    return next();
});

server.append('AddProduct', function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var promotionsDecorator = require('*/cartridge/models/product/decorators/promotions');
    var pdpPromotions = new Template('product/components/promotions');
    var currentBasket = BasketMgr.getCurrentBasket();
    var product = Object.create(null);
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(ProductMgr.getProduct(req.form.pid));
    promotionsDecorator(product, promotions);
    var Product = { product: product };
    var context = new HashMap();
    Object.keys(Product).forEach(function (key) {
        context.put(key, Product[key]);
    });
    cartHelper.createFreeLineItem(currentBasket, 0);
    var viewData = res.getViewData();
    viewData.pdpPromotions = pdpPromotions.render(context).text;
    if (
        req.currentCustomer &&
        req.currentCustomer.raw &&
        req.currentCustomer.raw.profile
    ) {
        dynamicBadgeHelpers.updateCartDetailInProfile(
            req.currentCustomer.raw.profile
        );
    }
    res.setViewData(viewData);
    next();
});

server.post('Merge', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var cartHelpers = require('*/cartridge/scripts/cart/cartHelpers');
    var storedBasketProducts = req.form.storedBasketProducts;
    var result;
    storedBasketProducts = JSON.parse(storedBasketProducts);
    if (req.currentCustomer.raw.authenticated && storedBasketProducts.length) {
        Transaction.wrap(function () {
            result = cartHelpers.mergeCart(storedBasketProducts);
        });
        if (
            req.currentCustomer &&
            req.currentCustomer.raw &&
            req.currentCustomer.raw.profile
        ) {
            dynamicBadgeHelpers.updateCartDetailInProfile(
                req.currentCustomer.raw.profile
            );
        }
    }
    res.json(result);
    next();
});

/**
 * Cart-AddProductFromOrder : The Cart-AddProductFromOrder endpoint add products to cart from order listing page
 * @name Cart-AddProductFromOrder
 */
server.post('AddProductFromOrder', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();

    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(req.form.orderNumber);
    var productLineItems = order.getProductLineItems();
    var redirectUrl = URLUtils.url('Cart-Show');
    var result = {
        error: false
    };

    var existingLineItems = currentBasket ? currentBasket.getAllProductLineItems() : [];
    if (existingLineItems && existingLineItems.length > 0) {
        for (var j = 0; j < existingLineItems.length; j++) {
            if (existingLineItems[j].product.custom.isEgiftCard === true) {
                res.json({
                    redirectUrl: redirectUrl.toString(),
                    isGiftCardLineItemExist: true,
                    message: Resource.msg('egift.delete.product.confirmation.modal.msg1','giftcards',null)
                });
                this.emit('route:Complete', req, res);
                return;
            }
        }
    }

    if (currentBasket) {
        Transaction.wrap(function () {
            result = {
                error: false,
                message: Resource.msg('text.alert.addedtobasket', 'product', null)
            };

            var childProducts = [];
            for (var i = 0; i < productLineItems.getLength(); i++) {
                var pli = productLineItems[i];
                if (!pli.bonusProductLineItem && pli.product && (!pli.product.primaryCategory || !pli.product.primaryCategory.ID || pli.product.primaryCategory.ID !== 'giftWrapProducts')) {
                    var pidOptions = {};
                    var PIDObjResult = cartHelper.addProductToCart(
                        currentBasket,
                        pli.productID,
                        pli.quantity.value,
                        childProducts,
                        pidOptions,
                        false
                    );
                    if (PIDObjResult.error) {
                        result.error = PIDObjResult.error;
                        result.message = PIDObjResult.message;
                    }
                }
            }
        });
    }
    if (result.error) {
        res.json({
            error: result.error,
            message: result.message
        });
    } else {
        res.json({
            redirectUrl: redirectUrl.toString(),
            error: result.error,
            message: result.message
        });
    }

    next();
});

/**
 * Cart-MiniCartShow : The Cart-MiniCartShow extended for customization
 * @name Cart-MiniCartShow
 * @function
 * @memberof Cart
 */
server.append('MiniCartShow', csrfProtection.generateToken, function (req, res, next) {
    var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    var showTopOffers = Site.getCurrent().getCustomPreferenceValue('showTopOffers');
    var viewData = res.getViewData();
    var list = productListHelper.getCurrentOrNewList(req.currentCustomer.raw, {
        type: 10
    });

    var optionId = null;
    var optionVal = null;

    var config = {
        qty: 1,
        optionId: optionId,
        optionValue: optionVal,
        req: req,
        type: 10
    };

    for (var i = 0; i < viewData.items.length; i++) {
        viewData.items[i].itemExist = productListHelper.itemExists(list, viewData.items[i].id, config);
    }
    if (currentBasket && showTopOffers === true) {
        var topOffers = cartHelper.getTopOffers(currentBasket);
        viewData.topOffers = topOffers;
        res.setViewData(viewData);
    }
    next();
});
/*
 * Append Cart-Show method to show dangerous goods message
 */
server.append(
    'Show',
    server.middleware.https,
    function (req, res, next) {
        var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
        var dangerousGoodsExists = req.querystring.error === 'dangerous-goods';
        var viewData = res.getViewData();
        var currentBasket = BasketMgr.getCurrentBasket();
        var changes = cartHelper.createFreeLineItem(currentBasket, 0);
        var basketModel = new CartModel(currentBasket);
        if (changes) {
            viewData.items = basketModel.items;
        }
        viewData.dangerousGoodsExists = dangerousGoodsExists;
        var list = productListHelper.getCurrentOrNewList(req.currentCustomer.raw, {
            type: 10
        });

        var optionId = null;
        var optionVal = null;

        var config = {
            qty: 1,
            optionId: optionId,
            optionValue: optionVal,
            req: req,
            type: 10
        };

        for (var i = 0; i < viewData.items.length; i++) {
            viewData.items[i].itemExist = productListHelper.itemExists(list, viewData.items[i].id, config);
        }
        res.setViewData(viewData);
        next();
    }
);

server.get('MissingFree', function (req, res, next) {
    var collections = require('*/cartridge/scripts/util/collections');
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions();
    var currentBasket = BasketMgr.getCurrentBasket();
    var qualifyingValueInCart;
    var buy;
    var get;
    var discountType;
    var qualifyingProducts;
    var discountedProducts;
    var loosingFree = false;
    collections.forEach(promotions, function (promotion) {
        qualifyingValueInCart = 0;
        buy = promotion.custom && 'Buy' in promotion.custom && promotion.custom.Buy ? promotion.custom.Buy : false;
        get = promotion.custom && 'Get' in promotion.custom && promotion.custom.Get ? promotion.custom.Get : false;
        discountType = promotion.custom && 'ForSelector' in promotion.custom && promotion.custom.ForSelector ? promotion.custom.ForSelector.value : false;
        qualifyingProducts = promotion.custom && 'qualifyingProducts' in promotion.custom && promotion.custom.qualifyingProducts ? promotion.custom.qualifyingProducts.split(',') : false;
        discountedProducts = promotion.custom && 'discountedProducts' in promotion.custom && promotion.custom.discountedProducts ? promotion.custom.discountedProducts.split(',') : false;
        if (!discountedProducts && qualifyingProducts) {
            discountedProducts = qualifyingProducts;
        }
        if (buy && get && discountType && qualifyingProducts && discountedProducts && discountType === 'Free') {
            collections.forEach(currentBasket.allProductLineItems, function (item) {
                if (qualifyingProducts.includes(item.productID)) {
                    qualifyingValueInCart += item.quantityValue;
                }
            });
            var indexToApply = buy.length - 1;
            var getValue;
            if (qualifyingValueInCart < (buy[indexToApply] + get[indexToApply]) && ((buy[indexToApply] + get[indexToApply]) - qualifyingValueInCart) >= (buy[indexToApply - 1] + get[indexToApply - 1])) {
                indexToApply--;
            } else {
                while ((buy[indexToApply] + get[indexToApply]) <= qualifyingValueInCart) {
                    qualifyingValueInCart -= (buy[indexToApply] + get[indexToApply]);
                }
                if (qualifyingValueInCart < (buy[indexToApply] + get[indexToApply]) && ((buy[indexToApply] + get[indexToApply]) - qualifyingValueInCart) >= (buy[indexToApply - 1] + get[indexToApply - 1])) {
                    indexToApply--;
                }
            }

            getValue = get[indexToApply];

            if (indexToApply > 0) {
                qualifyingValueInCart -= get[indexToApply -1 ];
                getValue -= get[indexToApply -1 ];
            }

            if (qualifyingValueInCart === buy[indexToApply]) {
                loosingFree = true;
            }
            if (qualifyingValueInCart > buy[indexToApply] && qualifyingValueInCart < buy[indexToApply] + getValue) {
                loosingFree = true;
            }
        }
    });
    res.json({ loosingFree: loosingFree });
    next();
});

module.exports = server.exports();
