'use strict';

var server = require('server');
server.extend(module.superModule);

var site = require('dw/system/Site');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var productMgr = require('dw/catalog/ProductMgr');
var fullProduct = require('*/cartridge/models/product/fullProduct');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

/**
 * Get online products by category category should not null
 * @param {string} categoryName The first number.
 * @returns {dw.util.Collection} collection - Collection of online products.
 */
function getOnlineProductsByCategory(categoryName) {
    var category = CatalogMgr.getCategory(categoryName);
    return category ? category.onlineProducts : [];
}

/**
 * Get all online Greeting card products
 * @returns {dw.util.Collection} collection - Collection of online products.
 */
function getGreetingCardProducts() {
    var onlineProducts = getOnlineProductsByCategory(
        site.current.getCustomPreferenceValue('greetingCardCategoryName')
    );
    var products = [];
    for (var i = 0; i < onlineProducts.length; i++) {
        if (onlineProducts[i].availabilityModel.inStock) {
            var product = Object.create(null);
            var pid = onlineProducts[i].ID;
            var productTileParams = { pview: 'tile', pid: pid };
            var apiProduct = productMgr.getProduct(pid);
            var options = productHelper.getConfig(
                apiProduct,
                productTileParams
            );
            products.push(fullProduct(product, options.apiProduct, options));
        }
    }
    return products;
}

/**
 * Cart-Show : The Cart-Show endpoint
 * @name Cart-Show
 * @function
 * @memberof Cart
 */
server.append(
    'Show',
    function (req, res, next) {
        var viewData = res.getViewData();
        viewData.isGreetingCardEnable = site.current.getCustomPreferenceValue(
            'isGreetingCardEnable'
        );
        viewData.greetingCardMessageLimit =
            site.current.getCustomPreferenceValue('greetingCardMessageLimit');
        viewData.greetingCardProducts = getGreetingCardProducts();
        res.setViewData(viewData);
        next();
    },
    pageMetaData.computedPageMetaData
);

/**
 * Cart-AddProduct : The Cart-MiniCart endpoint is responsible for displaying the cart icon in the header with the number of items in the current basket
 * @name Rituals/Cart-AddProduct
 * @function
 * @memberof Cart
 */
server.append('AddProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var collections = require('*/cartridge/scripts/util/collections');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var greetingCardProduct = null;
    var greetingCardCategoryName = site.current.getCustomPreferenceValue(
        'greetingCardCategoryName'
    );
    collections.forEach(
        currentBasket.getAllProductLineItems(),
        function (productLineItem) {
            if (
                productLineItem.product &&
                productLineItem.product.categories.length > 0
            ) {
                collections.forEach(
                    productLineItem.product.categories,
                    function (category) {
                        if (category.ID === greetingCardCategoryName) {
                            greetingCardProduct = productLineItem.productID;
                        }
                    }
                );
            }
        }
    );

    if (req.form.greetingCardMessage && greetingCardProduct) {
        var greetingCardMessage = req.form.greetingCardMessage;
        collections.forEach(
            currentBasket.getAllProductLineItems(),
            function (productLineItem) {
                Transaction.wrap(function () {
                    if (productLineItem.productID === greetingCardProduct) {
                        productLineItem.custom.greetingCardMessage =
                            greetingCardMessage;
                    }
                });
            }
        );
    }

    next();
});

module.exports = server.exports();
