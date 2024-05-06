/**
 * File Name          : product.js
 * Description        : productHelpers.js
 * Ver          Modification
 * 1.0          Common functions
 */

'use strict';

var site = require('dw/system/Site');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var productMgr = require('dw/catalog/ProductMgr');
var collections = require('*/cartridge/scripts/util/collections');
var fullProduct = require('*/cartridge/models/product/fullProduct');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

/**
 * This function macthes passing categoryName with all categories of products and return true is match else false
 * @param {dw.catalog.Product} product - Product of dw.catalog.Product class
 * @param {string} categoryName - Category name for match
 * @returns {boolean} - This will return true if product have this categoryName
 */
function isCategoryMatches(product, categoryName) {
    var isCatMatches = false;
    if (product && product.categories.length > 0) {
        collections.forEach(product.categories, function (category) {
            if (category.ID === categoryName) {
                isCatMatches = true;
            }
        });
    }
    return isCatMatches;
}

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
 * Get all online Gift wrap products
 * @param {dw.util.Collection} products : Products
 * @returns {Array} Full product information according to @link cartridge/models/product/fullProduct.
 */
function fetchFullProducts(products) {
    var fullProducts = [];
    for (var i = 0; i < products.length; i++) {
        if (products[i].availabilityModel.inStock) {
            var product = Object.create(null);
            var pid = products[i].ID;
            var productTileParams = { pview: 'tile', pid: pid };
            var apiProduct = productMgr.getProduct(pid);
            var options = productHelper.getConfig(
                apiProduct,
                productTileParams
            );
            fullProducts.push(
                fullProduct(product, options.apiProduct, options)
            );
        }
    }
    return fullProducts;
}

/**
 * Get full detail of all online products by category
 * @param {string} categoryName - Category Name
 * @returns {dw.util.Collection} collection - Collection of online products.
 */
function getFullOnlineProducts(categoryName) {
    return fetchFullProducts(
        getOnlineProductsByCategory(
            site.current.getCustomPreferenceValue(categoryName)
        )
    );
}
/**
 * Find ProductLineItem from productLineItems on category name match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems : Product line items
 * @param {string} categoryName : category name
 * @returns {dw.order.ProductLineItem} : Retrun product line item is category matches else return null
 */
function getProductLineItemByCategory(productLineItems, categoryName) {
    var productLineItem = null;
    collections.forEach(productLineItems, function(pli) {
        if (isCategoryMatches(pli.product, categoryName)) {
            productLineItem = pli;
        }
    });
    return productLineItem;
}

module.exports = {
    isCategoryMatches: isCategoryMatches,
    getOnlineProductsByCategory: getOnlineProductsByCategory,
    fetchFullProducts: fetchFullProducts,
    getProductLineItemByCategory: getProductLineItemByCategory,
    getFullOnlineProducts: getFullOnlineProducts
};
