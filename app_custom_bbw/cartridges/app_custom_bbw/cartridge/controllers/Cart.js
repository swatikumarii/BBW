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
        res.setStatusCode(400);
        res.json({
            error: true,
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
    var currentBasket = BasketMgr.getCurrentBasket();
    cartHelper.createFreeLineItem(currentBasket, 0);
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
    var result;

    if (currentBasket) {
        Transaction.wrap(function () {
            result = {
                error: false,
                message: Resource.msg('text.alert.addedtobasket', 'product', null)
            };

            var childProducts = [];
            for (var i = 0; i < productLineItems.getLength(); i++) {
                var pli = productLineItems[i];
                if (!pli.bonusProductLineItem && (!pli.product.primaryCategory || !pli.product.primaryCategory.ID || pli.product.primaryCategory.ID !== 'giftWrapProducts')) {
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

    var redirectUrl = URLUtils.url('Cart-Show');
    res.json({
        redirectUrl: redirectUrl.toString(),
        error: result.error,
        message: result.message
    });

    next();
});

module.exports = server.exports();
