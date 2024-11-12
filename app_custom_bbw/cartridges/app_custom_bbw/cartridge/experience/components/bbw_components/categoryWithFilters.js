
'use strict';

// Global response
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
var collections = require('*/cartridge/scripts/util/collections');

/**
 * get level one category
 * @param  {object} category category
 * @returns  {Array} category level one
 */
function getLevelOneCategory(category) {
    if (category.parent.ID === 'root') {
        return category;
    }
    return getLevelOneCategory(category.parent);
}

/**
 *
 * @param {*} categoryName  category name
 * @param {*} res  The response object for the current controller request
 * @returns if product is in stock then true else false
 */
function isProductIDsAvailableByCategoryName(categoryName){
    var productIds = searchHelper.getOnlineProductsByCategory(categoryName, {});
    return productIds && productIds.length > 0;
}

/**
 * Render logic for storefront.imageAndText component.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge.
 * This will not be passed in by Commerce Cloud Platform.
 * @returns {string} The markup to be displayed
 */

module.exports.render = function (context, modelIn) {
    var model = modelIn || new HashMap();
    var content = context.content;
    var req = { querystring: {
        cgid: content.categoryID
    },
    pageMetaData: request.pageMetaData
    };
    var result = searchHelper.search(req, {});
    if (result.apiProductSearch && result.apiProductSearch.category) {
        result.productSearch.levelOneCategory = getLevelOneCategory(
            result.apiProductSearch.category
        );
    }

    var levelTwoCategories = [];
    collections.forEach(result.productSearch.levelOneCategory.onlineSubCategories, function (subCat2) {
        if (subCat2.custom && subCat2.custom.showInMenu
            && subCat2.hasOnlineSubCategories() && isProductIDsAvailableByCategoryName(subCat2.ID)) {
            var levelThreeCategories = [];
            collections.forEach(subCat2.onlineSubCategories, function (subCat) {
                if (subCat.custom && subCat.custom.showInMenu &&
                    subCat.products.empty === false && subCat.onlineProducts.empty === false && isProductIDsAvailableByCategoryName(subCat.ID)) {
                    levelThreeCategories.push({
                        'ID': subCat.ID,
                        'displayName': subCat.displayName,
                        'absURL': subCat.thumbnail ? subCat.thumbnail.absURL : '',
                        'isShowCategoryInSlider': subCat.custom.showCategoryInSlider === null || subCat.custom.showCategoryInSlider
                    });
                }
            });
            levelTwoCategories.push({
                'ID': subCat2.ID,
                'displayName': subCat2.displayName,
                'levelThreeCategories': levelThreeCategories
            });
        }
    });
    model.productSearch = result.productSearch;
    model.productSearch.levelOneCategory = {
        slotId: result.productSearch.levelOneCategory.custom.slotId,
        levelTwoCategories: levelTwoCategories
    };
    model.productSearch.isCategorySearch = true;
    model.maxSlots = result.maxSlots;
    model.reportingURLs = null;
    model.refineurl = result.refineurl;
    model.category = result.category? result.category : null;
    model.canonicalUrl = result.canonicalUrl;
    model.schemaData = result.schemaData;
    model.apiProductSearch = result.apiProductSearch;

    return new Template('experience/components/bbw_components/categoryWithFilters').render(model).text;
};
