'use strict';

var server = require('server');
server.extend(module.superModule);

server.prepend('RemoveProductLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var collections = require('*/cartridge/scripts/util/collections');
    var currentBasket = BasketMgr.getCurrentBasket();
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var bundlingHelpers = require('*/cartridge/scripts/helpers/bundlingHelpers');

    var customProductBundle = false;
    if (
        req.querystring.pid &&
        req.querystring.uuid &&
        'custom' in session &&
        session.custom.customBundlesInCart
    ) {
        var indexToRemove;
        var bundleToRemove;
        var productLineItems = currentBasket.getAllProductLineItems(
            req.querystring.pid
        );
        for (var i = 0; i < productLineItems.length; i++) {
            var item = productLineItems[i];
            if (
                item.UUID === req.querystring.uuid &&
                item.custom.customBundle &&
                !item.bonusDiscountLineItem
            ) {
                var itemBundle = item.custom.customBundle;
                var customBundlesInCart = JSON.parse(
                    session.custom.customBundlesInCart
                );
                var positionInCart =
                    customBundlesInCart.name.indexOf(itemBundle);
                indexToRemove = item.custom.customBundleIndex;
                bundleToRemove = item.custom.customBundle;
                customBundlesInCart.qty[positionInCart]--;
                session.custom.customBundlesInCart =
                    JSON.stringify(customBundlesInCart);
                customProductBundle = true;
            }
        }
        var productInCart;
        var updateQuantity;
        var nonBundleProduct;
        var maxProductQty;
        var removeProductArray = [];
        var productsToReAdd = [];
        var viewData = res.getViewData();
        Transaction.wrap(function () {
            collections.forEach(
                BasketMgr.getCurrentBasket().productLineItems,
                function (currentProductLineItem) {
                    if (
                        currentProductLineItem.custom.customBundle ===
                            bundleToRemove &&
                        currentProductLineItem.custom
                            .customBundleIndex === indexToRemove
                    ) {
                        if (
                            currentProductLineItem.UUID !== req.querystring.uuid
                        ) {
                            productInCart =
                                bundlingHelpers.getExistingNonBundleProductLineItemsInCart(
                                    currentProductLineItem.productID,
                                    currentBasket.productLineItems
                                );
                            // eslint-disable-next-line no-param-reassign
                            currentProductLineItem.custom.customBundle =
                                '';
                            // eslint-disable-next-line no-param-reassign
                            currentProductLineItem.custom.customBundleIndex =
                                '';
                            // eslint-disable-next-line no-param-reassign
                            // currentProductLineItem.custom.isCustomBundleProduct = false;
                            if (productInCart) {
                                nonBundleProduct = productInCart.product;
                                maxProductQty =
                                    nonBundleProduct &&
                                    nonBundleProduct.custom &&
                                    'maxProductQty' in
                                        nonBundleProduct.custom &&
                                    nonBundleProduct.custom.maxProductQty
                                        ? nonBundleProduct.custom.maxProductQty
                                        : null;
                                if (
                                    maxProductQty &&
                                    productInCart.quantity.value <
                                        nonBundleProduct.custom.maxProductQty
                                ) {
                                    updateQuantity =
                                        productInCart.quantity.value +
                                        currentProductLineItem.quantity.value;
                                    productInCart.setQuantityValue(
                                        updateQuantity
                                    );
                                } else if (maxProductQty === null) {
                                    updateQuantity =
                                        productInCart.quantity.value +
                                        currentProductLineItem.quantity.value;
                                    productInCart.setQuantityValue(
                                        updateQuantity
                                    );
                                }
                                var shipmentToRemove =
                                    currentProductLineItem.shipment;
                                currentBasket.removeProductLineItem(
                                    currentProductLineItem
                                );
                                removeProductArray.push(
                                    currentProductLineItem.UUID
                                );
                                if (
                                    shipmentToRemove.productLineItems.empty &&
                                    !shipmentToRemove.default
                                ) {
                                    currentBasket.removeShipment(
                                        shipmentToRemove
                                    );
                                }
                            } else {
                                // productsToReAdd.push({ pid: currentProductLineItem.productID, qty: currentProductLineItem.quantity.value });
                                currentBasket.removeProductLineItem(
                                    currentProductLineItem
                                );
                            }
                        }
                    } else if (
                        currentProductLineItem.custom.customBundle ===
                            bundleToRemove &&
                        currentProductLineItem.custom.customBundleIndex >
                            indexToRemove
                    ) {
                        // eslint-disable-next-line no-param-reassign
                        currentProductLineItem.custom.customBundleIndex -= 1;
                    }
                }
            );
        });
        viewData.removeProducts = removeProductArray;
        productsToReAdd.forEach(function (elem) {
            Transaction.wrap(function () {
                session.custom.addingBundle = false;
                cartHelper.addProductToCart(
                    currentBasket,
                    elem.pid,
                    elem.qty
                );
            });
        });
    }
    res.setViewData({
        customProductBundle: customProductBundle
    });
    next();
});

module.exports = server.exports();
