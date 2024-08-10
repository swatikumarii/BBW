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
var productValidationHelpers = require('*/cartridge/scripts/helpers/productValidationHelpers');
var giftWrapCartHelpers = require('*/cartridge/scripts/helpers/cart/giftWrap');
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
        var CouponMgr = require('dw/campaign/CouponMgr');
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
        var coupon = CouponMgr.getCouponByCode(req.querystring.couponCode);
        if (coupon) {
            var couponPromos = coupon.getPromotions();
            if (couponPromos.length === 0) {
                error = true;
                errorMessage = Resource.msg('error.coupon.unknown', 'cart', null);
            } else {
                try {
                    Transaction.wrap(function () {
                        return currentBasket.createCouponLineItem(
                            req.querystring.couponCode,
                            true
                        );
                    });
                } catch (e) {
                    error = true;
                    var errorCodes = {
                        COUPON_CODE_ALREADY_IN_BASKET: 'error.coupon.already.in.cart',
                        COUPON_ALREADY_IN_BASKET: 'error.coupon.cannot.be.combined',
                        COUPON_CODE_ALREADY_REDEEMED: 'error.coupon.already.redeemed',
                        COUPON_CODE_UNKNOWN: 'error.unable.to.add.coupon',
                        COUPON_DISABLED: 'error.unable.to.add.coupon',
                        REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon',
                        TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon',
                        NO_ACTIVE_PROMOTION: 'error.unable.to.add.coupon',
                        default: 'error.unable.to.add.coupon'
                    };

                    var errorMessageKey = errorCodes[e.errorCode] || errorCodes.default;
                    errorMessage = Resource.msg(errorMessageKey, 'cart', null);
                    // error = true;
                    // errorMessage = cartHelper.checkCouponCodeError(
                    //     req.querystring.couponCode, e.errorCode
                    // );
                }
            }
        }else{
            error = true;
            errorMessage = Resource.msgf('error.coupon.invlaid', 'cart', null, req.querystring.couponCode);
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

/**
 * Cart-UpdateQuantity : The Cart-UpdateQuantity endpoint handles updating the quantity of a product line item in the basket
 * @name Cart-UpdateQuantity
 * @function
 * @memberof Cart
 * @returns {object} - json
 */
server.replace('UpdateQuantity', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var collections = require('*/cartridge/scripts/util/collections');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');


    var currentBasket = BasketMgr.getCurrentBasket();
    var previousBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var productId = req.querystring.pid;
    var updateQuantity = parseInt(req.querystring.quantity, 10);
    var uuid = req.querystring.uuid;
    var productLineItems = currentBasket.productLineItems;
    var matchingLineItem = collections.find(productLineItems, function (item) {
        return item.productID === productId && item.UUID === uuid;
    });
    var availableToSell = 0;

    var totalQtyRequested = 0;
    var qtyAlreadyInCartPID = 0;
    var minOrderQuantity = 0;
    var perpetual = false;
    var canBeUpdated = false;
    var bundleItems;
    var maxProductQty=0;
    var maxProductQtyLeft=0;
    var qtyAlreadyInCartUUID=0;
    var existingPliQty = 0;
    var bonusDiscountLineItemCount = currentBasket.bonusDiscountLineItems.length;

    if (matchingLineItem) {
        if (matchingLineItem.product.bundle) {
            bundleItems = matchingLineItem.bundledProductLineItems;
            canBeUpdated = collections.every(bundleItems, function (item) {
                var quantityToUpdate = updateQuantity
                    * matchingLineItem.product.getBundledProductQuantity(item.product).value;
                var qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                    item.productID,
                    productLineItems,
                    item.UUID
                );
                totalQtyRequested = quantityToUpdate + qtyAlreadyInCart;
                availableToSell = item.product.availabilityModel.inventoryRecord.ATS.value;
                perpetual = item.product.availabilityModel.inventoryRecord.perpetual;
                minOrderQuantity = item.product.minOrderQuantity.value;
                return (totalQtyRequested <= availableToSell || perpetual)
                    && (quantityToUpdate >= minOrderQuantity);
            });
        } else {
            existingPliQty = matchingLineItem.quantityValue;
            availableToSell = productValidationHelpers.getProductMaxOrderQty(matchingLineItem.product);
            perpetual = matchingLineItem.product.availabilityModel.inventoryRecord.perpetual;
            qtyAlreadyInCartPID = cartHelper.getQtyAlreadyInCart(
                productId,
                productLineItems
            );
            qtyAlreadyInCartUUID = cartHelper.getQtyAlreadyInCart(
                productId,
                productLineItems,
                matchingLineItem.UUID
            );
            // Checking total qty of a pid in cart with addition of how much increase is requested.
            totalQtyRequested =
                (updateQuantity - existingPliQty) +  qtyAlreadyInCartPID;
            // Case: User tries to change qty higher than the maxOrderQty
            if (qtyAlreadyInCartPID < availableToSell && totalQtyRequested > availableToSell)
            {
                if (qtyAlreadyInCartUUID) {
                    // Case where more than one line item of same pid exist
                    updateQuantity =
                        availableToSell -
                        qtyAlreadyInCartPID +
                        existingPliQty;
                    totalQtyRequested = availableToSell;
                } else {
                    updateQuantity = availableToSell;
                    totalQtyRequested = availableToSell;
                }
            }
            minOrderQuantity = matchingLineItem.product.minOrderQuantity.value;
            canBeUpdated = (totalQtyRequested <= availableToSell || perpetual)
                && (updateQuantity >= minOrderQuantity);
            if (canBeUpdated && updateQuantity > availableToSell) {
                updateQuantity = availableToSell;
            }
        }
    }
    // Added case where user tries to decrease the qty when out of stock.
    if (canBeUpdated || (updateQuantity < existingPliQty)) {
        maxProductQtyLeft = availableToSell - totalQtyRequested;
        Transaction.wrap(function () {
            matchingLineItem.setQuantityValue(updateQuantity);

            var previousBounsDiscountLineItems = collections.map(
                currentBasket.bonusDiscountLineItems,
                function (bonusDiscountLineItem) {
                    return bonusDiscountLineItem.UUID;
                }
            );

            basketCalculationHelpers.calculateTotals(currentBasket);
            if (
                currentBasket.bonusDiscountLineItems.length >
                bonusDiscountLineItemCount
            ) {
                var prevItems = JSON.stringify(previousBounsDiscountLineItems);

                collections.forEach(
                    currentBasket.bonusDiscountLineItems,
                    function (bonusDiscountLineItem) {
                        if (prevItems.indexOf(bonusDiscountLineItem.UUID) < 0) {
                            bonusDiscountLineItem.custom.bonusProductLineItemUUID =
                                matchingLineItem.UUID; // eslint-disable-line
                            matchingLineItem.custom.bonusProductLineItemUUID =
                                'bonus';
                            matchingLineItem.custom.preOrderUUID =
                                matchingLineItem.UUID;
                        }
                    }
                );
            }
        });
    }

    var urlObject = {
        url: URLUtils.url('Cart-ChooseBonusProducts').toString(),
        configureProductstUrl: URLUtils.url('Product-ShowBonusProducts').toString(),
        addToCartUrl: URLUtils.url('Cart-AddBonusProducts').toString()
    };
    var newBonusDiscountLineItem = cartHelper.getNewBonusDiscountLineItem(
        currentBasket,
        previousBonusDiscountLineItems,
        urlObject,
        matchingLineItem.UUID
    );
    if (newBonusDiscountLineItem) {
        var allLineItems = currentBasket.allProductLineItems;
        collections.forEach(allLineItems, function (pli) {
            if (pli.UUID === matchingLineItem.UUID) {
                Transaction.wrap(function () {
                    pli.custom.bonusProductLineItemUUID = 'bonus'; // eslint-disable-line no-param-reassign
                    pli.custom.preOrderUUID = pli.UUID; // eslint-disable-line no-param-reassign
                });
            }
        });
    }

    var basketModel = new CartModel(currentBasket);
    basketModel.maxProductQty = maxProductQty;
    basketModel.newBonusDiscountLineItem = newBonusDiscountLineItem || {};
    basketModel.maxProductQtyLeft = maxProductQtyLeft;
    basketModel.updatedQty = matchingLineItem.quantityValue;
    maxProductQty = productValidationHelpers.getProductMaxOrderQty(matchingLineItem.product);
    if (!newBonusDiscountLineItem && previousBonusDiscountLineItems) {
        basketModel.loosingBonus = true;
    } else {
        basketModel.loosingBonus = false;
    }
    if (matchingLineItem && canBeUpdated) {
        res.json(basketModel);
    } else if (updateQuantity < existingPliQty) {
        // Overstock case data sent back for handling on the client side.
        res.json(basketModel);
    } else {
        res.setStatusCode(500);
        res.json({
            errorMessage: Resource.msg(
                'error.cannot.update.product.quantity',
                'cart',
                null
            )
        });
    }

    return next();
});

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

// Plugin gift card and gift wrap routes

/**
 * Cart-UpdateQuantity : The Cart-UpdateQuantity endpoint handles updating the quantity of a product line item in the basket
 * @name Cart-UpdateQuantity
 */
server.prepend('UpdateQuantity', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var productHelpers = require('*/cartridge/scripts/helpers/product');
    var customPreferenceNames = require('*/cartridge/config/customPreferenceNames');
    var giftWrapCategoryName = Site.current.getCustomPreferenceValue(
        customPreferenceNames.giftWrapCategoryName
    );
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }
    if (req.querystring.pid && req.querystring.uuid) {
        var giftWrapProductLineItem = productHelpers.getProductLineItemByCategory(
            currentBasket.getAllProductLineItems(),
            giftWrapCategoryName
        );
        if (giftWrapProductLineItem) {
            if (giftWrapProductLineItem.product.ID === req.querystring.pid) {
                res.json({
                    error: true,
                    errorMessage: Resource.msg(
                        'error.update.giftwrap.product.quantity',
                        'giftWrap',
                        null
                    )
                });
                return this.emit('route:Complete', req, res);
            }
            giftWrapCartHelpers.handleUpdateQuantity(
                currentBasket, giftWrapProductLineItem,
                req.querystring.pid,
                req.querystring.quantity
            );
        }
    }
    return next();
});

/**
 * Cart-UpdateQuantity : The Cart-UpdateQuantity endpoint handles updating the quantity of a product line item in the basket
 * @name Cart-UpdateQuantity
 */
server.append(
    'UpdateQuantity',
    function (req, res, next) {
        var currentBasket = BasketMgr.getCurrentBasket();
        res.setViewData(
            giftWrapCartHelpers.getGiftWrapLineItemCart(currentBasket)
        );
        next();
    }
);

server.prepend('RemoveProductLineItem', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();
    viewData.previousBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();
    res.setViewData(viewData);
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
    viewData.basket= basketModel;
    var newBonusDiscountLineItem = currentBasket.getBonusDiscountLineItems();
    if (viewData.previousBonusDiscountLineItems && newBonusDiscountLineItem.length !== viewData.previousBonusDiscountLineItems.length) {
        viewData.basket.loosingBonus = true;
    } else {
        viewData.basket.loosingBonus = false;
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
 *
 * @param {object} order - Order or Current Basket Object
 * @param {string} UUID - UUID of the lineItem
 * @returns {string} - Prorated Price
 */
function getProratedPrice(order, UUID) {
    var proratedPrice = 0;
    for (var index = 0; index < order.allProductLineItems.length; index++) {
        var product = order.allProductLineItems[index];
        if (product.UUID === UUID) {
            proratedPrice = (
                product.proratedPrice.value / product.quantityValue
            ).toFixed(2);
            break;
        }
    }
    return proratedPrice;
}

server.prepend('RemoveProductLineItem', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();
    var UUID = req.querystring.uuid;
    viewData.proratedPrice = getProratedPrice(currentBasket, UUID);
    res.setViewData(viewData);
    next();
});

/**
 * Cart-AddProduct : The Cart-AddProduct endpoint check product price and retrun if price is zero
 * @name Cart-AddProduct
 */
server.prepend('AddProduct', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var price = cartHelper.getProductPrice(req.form.pid);
    var currentBasket = BasketMgr.getCurrentBasket();
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
    var isFromPlp = req.form.plp === 'true';
    if (isFromPlp) {
        var productLineItems =
            currentBasket && currentBasket.getAllProductLineItems(req.form.pid);
        Transaction.wrap(function () {
            for (var i = 0; i < productLineItems.length; i++) {
                var item = productLineItems[i];
                currentBasket.removeProductLineItem(item);
            }
        });
    }
    if (req.form.quantity === '0' && currentBasket) {
        var quantityTotal = ProductLineItemsModel.getTotalQuantity(
            currentBasket.productLineItems
        );
        res.json({
            quantityTotal: quantityTotal,
            error: true,
            errorCode: 'DELETE-LINEITEM',
        });
        return this.emit('route:Complete', req, res);
    }
    return next();
});

server.append('AddProduct', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var promotionsDecorator = require('*/cartridge/models/product/decorators/promotions');
    var pdpPromotions = new Template('product/components/promotions');
    var currentBasket = BasketMgr.getCurrentBasket();
    var product = Object.create(null);
    var apiProduct = ProductMgr.getProduct(req.form.pid);
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
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
    var maxOrderQtyValue =
        productValidationHelpers.getProductMaxOrderQtyValue(apiProduct);
    viewData.maxOrderQty = maxOrderQtyValue;
    if (maxOrderQtyValue > 0) {
        viewData.maxOrderQtyMessage = Resource.msgf(
            'error.alert.selected.quantity.cannot.be.added.for.max',
            'product',
            null,
            maxOrderQtyValue,
            apiProduct.name
        );
    } else {
        viewData.maxOrderQtyMessage = Resource.msgf(
            'error.alert.selected.quantity.cannot.be.added.negative',
            'product',
            null,
            maxOrderQtyValue,
            apiProduct.name
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
        var enableQCeGift = Site.current.getCustomPreferenceValue('enableQwikcilver');
        var isGiftProductAvailable = false;
        var currentBasket = BasketMgr.getCurrentBasket();
        if (currentBasket) {
            if (enableQCeGift) {
                var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
                isGiftProductAvailable = qwikcilverHelpers.validateGiftProduct(currentBasket);
            }
            var changes = cartHelper.createFreeLineItem(currentBasket, 0);
            var basketModel = new CartModel(currentBasket);
            if (changes) {
                viewData.items = basketModel.items;
            }
            viewData.isGiftProductAvailable = isGiftProductAvailable;
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

server.append('EditBonusProduct', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var viewData = res.getViewData();
    viewData.labels.selectedprods =  Resource.msgf('modal.header.selected.products', 'product', null,viewData.selectedBonusProducts.length, viewData.maxBonusItems);
    res.setViewData(viewData);
    next();
});

server.get('UpdateShippingMethod', function (req, res, next) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var collections = require('*/cartridge/scripts/util/collections');
    var Transaction = require('dw/system/Transaction');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket) {
        var appliedShippingMethodID = currentBasket.getDefaultShipment().shippingMethodID;
        var applicableShippingMethods = ShippingMgr.getShipmentShippingModel(
            currentBasket.getDefaultShipment()
        ).getApplicableShippingMethods();
        var applicableShippingMethodsIDs = collections.map(applicableShippingMethods, function (applicableShippingMethod) {
            return applicableShippingMethod.ID;
        });
        if (!applicableShippingMethodsIDs.includes(appliedShippingMethodID)) {
            Transaction.wrap(function () {
                currentBasket.getDefaultShipment().setShippingMethod(applicableShippingMethods[0]);
            });
        }
    }
    res.json({success: true});
    next();
});

server.get('CheckMotivator', function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var decorators = require('*/cartridge/models/product/decorators/index');
    var pid = req.querystring.pid;
    var product = ProductMgr.getProduct(pid);
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(product);
    var motivator = {};
    decorators.promotions(motivator, promotions);
    res.json({motivator: motivator});
    next();
});

module.exports = server.exports();
