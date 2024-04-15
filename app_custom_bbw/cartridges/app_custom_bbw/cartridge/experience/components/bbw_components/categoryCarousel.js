'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
// var CatalogMgr = require('dw/catalog/CatalogMgr');

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
    // var category = content.category;
    var shopButtonText = content.shopButtonText;
    // var selectedCategory = CatalogMgr.getCategory(category.ID);

    model.carouselTitle = carouselTitle;
    model.shopButtonText = shopButtonText;
    return new Template('experience/components/bbw_components/categoryCarousel').render(model).text;
};
