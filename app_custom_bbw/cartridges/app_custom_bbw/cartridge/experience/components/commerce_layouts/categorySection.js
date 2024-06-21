'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');
var ProductFactory = require('*/cartridge/scripts/factories/product');
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var products = [];
var pids = [];
var productCount = 0;
var tileLimit = 0;
/**
 * Add Product
 * @param {object} product product object
 * @param {string} productId product id
 */
function addProduct(product, productId) {
    products.push(product);
    pids.push(productId);
    productCount++;
}

/**
 * Process Products
 * @param {string} productId product id
 * @param {boolean} showOutOfStockProducts true/false
 * @returns {boolean} true/false
 */
function processProduct(productId, showOutOfStockProducts) {
    if (pids.indexOf(productId) < 0) {
        var product = ProductFactory.get({ pid: productId });
        if ((showOutOfStockProducts === true && product.isSearchableIfUnavailable === true)  || product.available) {
            addProduct(product, productId);
            if (productCount === tileLimit) {
                return true; // tile limit reached
            }
        }
    }
    return false; // continue processing
}

/**
 * Process category products
 * @param {object} productsList product list
 * @param {boolean} showOutOfStockProducts true/false
 * @returns {boolean} true/false
 */
function processCategoryProducts(productsList, showOutOfStockProducts) {
    for (var index = 0; index < productsList.length; index++) {
        if (processProduct(productsList[index].ID, showOutOfStockProducts)) {
            return true; // tile limit reached
        }
    }
    return false; // continue processing
}

/**
 * Process Category
 * @param {object} categories category object
 * @param {boolean} showOutOfStockProducts true/false
 * @returns {boolean} true/false
 */
function processCategories(categories, showOutOfStockProducts) {
    for (var i = 0; i < categories.length; i++) {
        var category = categories[i];
        if (category.onlineProducts.length > 0) {
            if (processCategoryProducts(category.onlineProducts, showOutOfStockProducts)) {
                return true; // tile limit reached
            }
        }
        if (category.onlineSubCategories.length > 0) {
            if (processCategories(category.onlineSubCategories, showOutOfStockProducts)) {
                return true; // tile limit reached
            }
        }
    }
    return false; // continue processing
}

/**
 * Render logic for storefront to get content of category carousel
 * @param {dw.experience.ComponentScriptContext} context The component script context object.
 * @returns {string} The markup to be displayed
 */

module.exports.render = function (context, modelIn) {
    // collecting all values of the content
    products = [];
    pids = [];
    productCount = 0;
    tileLimit = 0;
    var model = modelIn || new HashMap();
    var content = context.content;
    var category = content.category;
    tileLimit = content.tileLimit;
    var showOutOfStockProducts = content.showOutOfStockProducts;
    var viewAllButtonText = content.viewAllButtonText ? content.viewAllButtonText : '';
    var component = context.component;

    model.regions = PageRenderHelper.getRegionModelRegistry(component);

    tileLimit = tileLimit > 0 ? tileLimit : 8;
    model.viewAllButtonText = viewAllButtonText;
    model.viewAllButtonLink = URLUtils.url('Search-Show', 'cgid', category.ID);
    var found = false;

    if (category.onlineProducts.length > 0) {
        found = processCategoryProducts(category.onlineProducts, showOutOfStockProducts);
    }

    if (!found && category.onlineSubCategories.length > 0) {
        found = processCategories(category.onlineSubCategories, showOutOfStockProducts);
    }
    model.selectedProducts = products;
    model.sectionCustomClass = content.sectionCustomClass;
    return new Template('experience/components/commerce_layouts/categorySection').render(model).text;
};
