'use strict';

var server = require('server');
server.extend(module.superModule);

var site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var BasketMgr = require('dw/order/BasketMgr');
var productHelpers = require('*/cartridge/scripts/helpers/product');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var giftWrapCartHelpers = require('*/cartridge/scripts/helpers/cart/giftWrap');
var greetingCardCartHelpers = require('*/cartridge/scripts/helpers/cart/greetingCard');
var customPreferenceNames = require('*/cartridge/config/customPreferenceNames');

/**
 * Cart-Show : The Cart-Show endpoint,
 * This append will use for
 * 1. Set isGiftWrapEnable according to custom preference
 * 2. Show Gift Wrap Products
 * Cart-Show : The Cart-Show endpoint
 * @name Cart-Show
 */
server.append(
    'Show',
    function (req, res, next) {
        var viewData = res.getViewData();

        if (viewData.items.length > 0) {
            res.setViewData(greetingCardCartHelpers.getGreetingCardConfig(viewData));
            res.setViewData(giftWrapCartHelpers.getGiftWrapConfig(viewData.items));
        }
        next();
    },
    pageMetaData.computedPageMetaData
);

/**
 * Cart-AddProduct : The Cart-RemoveProductLineItem endpoint removes a product line item from the basket
 * @name Cart-AddProduct
 */
server.prepend('AddProduct', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }
    giftWrapCartHelpers.removeGiftWrapLineItem(currentBasket, req.form.pid);
    greetingCardCartHelpers.removeGreetingCardProductLineItem(
        currentBasket,
        req.form.pid
    );
    return next();
});

/**
 * Cart-AddProduct : The Cart-MiniCart endpoint is responsible for displaying the cart icon in the header with the number of items in the current basket
 * @name Cart-AddProduct
 */
server.append('AddProduct', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentOrNewBasket();

    var productLineItems = currentBasket.getAllProductLineItems();

    greetingCardCartHelpers.updateGreetingCardMessage(
        productLineItems, req.form.greetingCardMessage
    );

    giftWrapCartHelpers.updateWrapForAllProductLineItem(
        currentBasket.getAllProductLineItems(), req.form.pid,
        req.form.giftWrapType, req.form.toBeIndividuallyWrappedPids
    );
    next();
});

/**
 * Cart-RemoveProductLineItem : The Cart-RemoveProductLineItem endpoint removes a product line item from the basket
 * @name Cart-RemoveProductLineItem
 */
server.prepend('RemoveProductLineItem', function (req, res, next) {
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
        giftWrapCartHelpers.handleRemoveProduct(
            currentBasket,
            req.querystring.pid
        );
        greetingCardCartHelpers.handleRemoveProduct(
            currentBasket,
            req.querystring.pid
        );
    }
    return next();
});

/**
 * Cart-UpdateQuantity : The Cart-UpdateQuantity endpoint handles updating the quantity of a product line item in the basket
 * @name Cart-UpdateQuantity
 */
server.prepend('UpdateQuantity', function (req, res, next) {

    var giftWrapCategoryName = site.current.getCustomPreferenceValue(
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
                res.setStatusCode(400);
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
        var viewData = res.getViewData();
        viewData.giftWrapLineItem =
            giftWrapCartHelpers.getGiftWrapLineItemCart(currentBasket);
        res.setViewData(viewData);
        next();
    },
    pageMetaData.computedPageMetaData
);

/**
 * Cart-RemoveProductLineItem : The Cart-RemoveProductLineItem endpoint handles delete product line item from the basket
 * @name Cart-RemoveProductLineItem
 */
server.append(
    'RemoveProductLineItem',
    function (req, res, next) {
        var currentBasket = BasketMgr.getCurrentBasket();
        var viewData = res.getViewData();
        viewData.giftWrapLineItem =
            giftWrapCartHelpers.getGiftWrapLineItemCart(currentBasket);
        res.setViewData(viewData);
        next();
    },
    pageMetaData.computedPageMetaData
);

module.exports = server.exports();
