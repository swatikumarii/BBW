'use strict';

var server = require('server');
server.extend(module.superModule);

var site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var BasketMgr = require('dw/order/BasketMgr');
var productMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var productHelpers = require('*/cartridge/scripts/helpers/product');
var giftWrapHelpers = require('*/cartridge/scripts/helpers/giftWrap');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var giftWrapCartHelpers = require('*/cartridge/scripts/helpers/cart/giftWrap');
var greetingCardCartHelpers = require('*/cartridge/scripts/helpers/cart/greetingCard');
var customPreferenceNames = require('*/cartridge/config/customPreferenceNames');

/**
 * Cart-Show : The Cart-Show endpoint,
 * This appand will use for
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
            viewData.isGreetingCardEnable = site.current.getCustomPreferenceValue(
                customPreferenceNames.isGreetingCardEnable
            );
            if (viewData.isGreetingCardEnable) {
                viewData.greetingCardMessageLimit =
                    site.current.getCustomPreferenceValue(customPreferenceNames.greetingCardMessageLimit);
                viewData.greetingCardProducts =
                    productHelpers.getFullOnlineProducts(
                        customPreferenceNames.greetingCardCategoryName
                    );
                viewData.isGiftWrapEnable =
                    site.current.getCustomPreferenceValue(customPreferenceNames.isGiftWrapEnable);
            }
            if (viewData.isGiftWrapEnable) {
                var wrappableProducts = [];
                var wrappedProductCount = 0;
                var wrappedProductQuantity = [];
                viewData.items.forEach(function(element) {
                    if (element.isGiftWrappable) {
                        wrappableProducts.push(element);
                        if (element.wrap.isWrapped) {
                            wrappedProductCount++;
                            wrappedProductQuantity.push(
                                element.wrap.wrappedQuantity
                            );
                        }
                    }
                });
                if (wrappableProducts.length === 0) {
                    viewData.isGiftWrapEnable = false;
                } else {
                    viewData.wrapItemMethod =
                        site.current.getCustomPreferenceValue(
                            customPreferenceNames.wrapItemMethod
                        ).value;
                    viewData.giftWrapProducts =
                        productHelpers.getFullOnlineProducts(
                            customPreferenceNames.giftWrapCategoryName
                        );
                    viewData.isDisableTogetherOption =
                        viewData.items.length !== wrappableProducts.length;
                    viewData.isDisableIndividualOption =
                        viewData.items.length === 1 &&
                        viewData.items[0].quantity === 1;
                    viewData.wrappableProducts = wrappableProducts;
                    viewData.wrapType = giftWrapHelpers.getWrapType(
                        wrappableProducts,
                        wrappedProductCount,
                        wrappedProductQuantity
                    );
                }
            }
        }
        res.setViewData(viewData);
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
        var giftWrapProductLineItem =
            productHelpers.getProductLineItemByCategory(
                currentBasket.getAllProductLineItems(),
                giftWrapCategoryName
            );
        if (giftWrapProductLineItem) {
            // If removed product is GiftWrapCategoryProduct than reset gift wrap attribute
            Transaction.wrap(function () {
                if (giftWrapProductLineItem.product.ID === req.querystring.pid) {
                    var productLineItems = currentBasket.getProductLineItems().toArray();
                    for (var j = 0; j < productLineItems.length; j++) {
                        var pli = productLineItems[j];
                        pli.custom.isWrapped = false;
                        pli.custom.wrappedQuantity = 0;
                    }
                } else {
                    var base = require('app_storefront_base/cartridge/scripts/cart/cartHelpers');
                    var product = productMgr.getProduct(req.querystring.pid);
                    var productInCart = base.getExistingProductLineItemInCart(
                        product,
                        req.querystring.pid,
                        currentBasket.productLineItems
                    );
                    // If wrappable product
                    // Than check is wrapped
                    if (
                        product.custom.isGiftWrappable &&
                        productInCart.custom.isWrapped
                    ) {
                        // Get total wrappable items
                        var productLineItemCount =
                            giftWrapHelpers.getWrappableProductCount(
                                currentBasket.getAllProductLineItems()
                            );
                        if (productLineItemCount === 1) {
                            // Fetch gift wrap category product
                            // RemoveProductLineItem
                            currentBasket.removeProductLineItem(
                                giftWrapProductLineItem
                            );
                        } else if (productInCart.custom.wrappedQuantity > 0) {
                            // Update Quantity of giftWrapped category product
                            if (
                                giftWrapProductLineItem.quantityValue >
                                productInCart.custom.wrappedQuantity
                            ) {
                                // UpdateQuantity
                                giftWrapProductLineItem.setQuantityValue(
                                    giftWrapProductLineItem.quantityValue -
                                        productInCart.custom.wrappedQuantity
                                );
                            } else {
                                // RemoveProductLineItem
                                currentBasket.removeProductLineItem(
                                    giftWrapProductLineItem
                                );
                            }
                        }
                    }
                }
            });
        }
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
                    errorMessage:
                    Resource.msg('error.update.giftwrap.product.quantity', 'giftWrap', null)
                });
                return this.emit('route:Complete', req, res);
            }
            var product = productMgr.getProduct(req.querystring.pid);
            var base = require('app_storefront_base/cartridge/scripts/cart/cartHelpers');
            var productInCart = base.getExistingProductLineItemInCart(
                product,
                req.querystring.pid,
                currentBasket.productLineItems
            );
            Transaction.wrap(function () {
                // If wrappable product
                // Than check is wrapped
                if (
                    product.custom.isGiftWrappable &&
                    productInCart.custom.isWrapped
                ) {
                    if (productInCart.custom.wrappedQuantity > 0) {
                        //  Update Quantity of giftWrapped category product
                        if (
                            productInCart.custom.wrappedQuantity >
                            req.querystring.quantity
                        ) {
                            if (
                                giftWrapProductLineItem.quantityValue >
                                productInCart.custom.wrappedQuantity -
                                    req.querystring.quantity
                            ) {
                                giftWrapProductLineItem.setQuantityValue(
                                    giftWrapProductLineItem.quantityValue -
                                        (productInCart.custom.wrappedQuantity -
                                            req.querystring.quantity)
                                );
                            } else {
                                // 'Gift wrap quantity can not be less than wrappable product quantity.';
                                res.setStatusCode(400);
                                res.json({
                                    error: true,
                                    errorMessage: Resource.msg(
                                        'internal.server.error',
                                        'common',
                                        null
                                    )
                                });

                                this.emit('route:Complete', req, res);
                                return;
                            }
                            productInCart.custom.wrappedQuantity = Number(
                                req.querystring.quantity
                            );
                        }
                    }
                }
            });
        }
    }
    return next();
});

module.exports = server.exports();
