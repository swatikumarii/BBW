'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');

/**
 * Render logic for storefront to get content of category carousel
 * @param {dw.experience.ComponentScriptContext} context The component script context object.
 * @returns {string} The markup to be displayed
 */

module.exports.render = function (context) {
    // collecting all values of the content
    var model = new HashMap();
    var content = context.content;
    var carouselTitle = content.carouselTitle;
    var category = content.category;
    var tileLimit = content.tileLimit;
    var shopButtonText = content.shopButtonText;

     // productsCount decides number of product tiles to be displayed
    if (tileLimit) {
        tileLimit = tileLimit > 0 ? tileLimit : false;
    }
    var productsCount = (tileLimit <= category.onlineProducts.length ? tileLimit : category.onlineProducts.length)
                    || category.onlineProducts.length;

    model.carouselTitle = carouselTitle;
    model.productsCount = tileLimit;
    model.shopButtonText = shopButtonText;
    model.shopButtonLink = URLUtils.url('Search-Show', 'cgid', category.ID);
    model.selectedProducts = category.onlineProducts;
    return new Template('experience/components/bbw_components/categoryCarousel').render(model).text;
};
