
'use strict';

// Global response
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');

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
    model.productSearch = result.productSearch;
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
