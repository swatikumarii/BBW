'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var site = require('dw/system/Site');

/**
 * Set dynamic badge for Fast Seller
 * @param {Array} products - Products
 */
function setFastSeller(products) {
    if (
        site.current.getCustomPreferenceValue('isLowStockDynamicBadgeEnabled')
    ) {
        var fastSellerThreshold = site.current.getCustomPreferenceValue(
            'fastSellerThreshold'
        );
        Transaction.wrap(function () {
            for (var i = 0; i < products.length; i++) {
                var product = products[i];
                if (
                    product.availabilityModel.inventoryRecord.ATS.value <
                    fastSellerThreshold
                ) {
                    product.custom.dynamicBadge = Resource.msg('label.dynamic.badge.fastseller', 'common', null);
                }
            }
        });
    }
}

/**
 * Set dynamic badge for Trending
 * @param {Array} products - Products
 * @param {string} unitConfig - Value will be like unitsYear, unitsDay, unitsWeek, unitsMonth 
 */
function setTrendingWithConfig(products, unitConfig) {
    products.sort(function (p1, p2) {
        if (!p1.activeData[unitConfig] && !p2.activeData[unitConfig]) {
            return 0;
        }
        if (!p1.activeData[unitConfig]) {
            return 1;
        }
        if (!p2.activeData[unitConfig]) {
            return 1;
        }
        if (p1.activeData[unitConfig] < p2.activeData[unitConfig]) {
            return 1;
        }
        if (p1.activeData[unitConfig] > p2.activeData[unitConfig]) {
            return -1;
        }
        return 0;
    });
    Transaction.wrap(function () {
        for (
            var i = 0;
            i < products.length && i < 100 && products[i].activeData[unitConfig];
            i++
        ) {
            var product = products[i];
            product.custom.dynamicBadge = Resource.msg('label.dynamic.badge.trending', 'common', null);
        }
    });
}

/**
 * Set dynamic badge for Trending
 * @param {Array} products - Products
 */
function setTrending(products) {
    if (
        site.current.getCustomPreferenceValue('isTrendingDynamicBadgeEnabled')
    ) {
        var trendingBadge =
            site.current.getCustomPreferenceValue('trendingBadge');
        if (trendingBadge) {
            setTrendingWithConfig(products, trendingBadge);
        }
    }
}

/**
 * Set dynamic badge for In Purchase
 * @param {Array} products - Products
 */
function setInPurchase(products) {
    if (
        site.current.getCustomPreferenceValue('isInPurchaseDynamicBadgeEnabled')
    ) {
        Transaction.wrap(function () {
            for (var i = 0; i < products.length; i++) {
                var product = products[i];
                if (product.activeData.unitsYear > 0) {
                    product.custom.dynamicBadge = Resource.msgf('label.dynamic.badge.purchases', 'common', null, product.activeData.unitsYear);
                }
            }
        });
    }
}

/**
 * @param {Array} productCarts - ProductCart
 * @param {string} productId - ProductID
 * @returns {object} data from productCarts with matching productId
 */
function getFromProductCarts(productCarts, productId) {
    for (var p = 0; p < productCarts.length; p++) {
        var pc = productCarts[p];
        if (pc.productId === productId) {
            return pc;
        }
    }
    return null;
}

/**
 * @param {Array} productCarts - ProductCart
 * @param {string} productId - ProductID
 * @returns {number} index of productCarts with matching productId
 */
function getIndexOfProductCarts(productCarts, productId) {
    for (var p = 0; p < productCarts.length; p++) {
        var pc = productCarts[p];
        if (pc.productId === productId) {
            return p;
        }
    }
    return -1;
}

/**
 * Set dynamic badge for In Cart
 * @param {Array} products - Products
 */
function setInCart(products) {
    if (site.current.getCustomPreferenceValue('isInCartDynamicBadgeEnabled')) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var query = 'firstName like \'*\'';
        var customerProfiles = CustomerMgr.queryProfiles(query, null, null, 1, 1);
        var productCarts = [];
        while (customerProfiles !== null && customerProfiles.hasNext()) {
            var cp = customerProfiles.next();
            if (
                cp.custom &&
                'cartProducts' in cp.custom &&
                cp.custom.cartProducts
            ) {
                var cartProducts = cp.custom.cartProducts;
                if (cartProducts && cartProducts.length > 0) {
                    for (var i = 0; i < cartProducts.length; i++) {
                        var cartProduct = cartProducts[i];
                        var productCartIndex = getIndexOfProductCarts(productCarts, cartProduct);
                        if (productCartIndex >= 0) {
                            productCarts[productCartIndex].count++;
                        } else {
                            productCarts.push({
                                productId: cartProduct,
                                count: 1
                            });
                        }
                    }
                }
            }
        }

        Transaction.wrap(function () {
            for (var ci = 0; ci < products.length; ci++) {
                var product = products[ci];
                var productInCart = getFromProductCarts(
                    productCarts,
                    product.ID
                );
                if (productInCart) {
                    product.custom.dynamicBadge = Resource.msgf(
                        'label.dynamic.badge.carts',
                        'common',
                        null,
                        productInCart.count
                    );
                }
            }
        });
    }
}

/**
 * @description This function is run by the job to get fragrance names list from all products.
 */
function execute() {
    var allProducts = ProductMgr.queryAllSiteProducts().asList().toArray();
    Transaction.wrap(function () {
        allProducts = allProducts.filter(function (product) {
            // eslint-disable-next-line
            product.custom.dynamicBadge = '';
            return (
                product.custom &&
                'isDynamicBadgeEnabled' in product.custom &&
                product.custom.isDynamicBadgeEnabled
            );
        });
    });
    setInPurchase(allProducts);
    setInCart(allProducts);
    setTrending(allProducts);
    setFastSeller(allProducts);
}

module.exports = {
    execute: execute
};
