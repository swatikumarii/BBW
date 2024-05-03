'use strict';

var URLUtils = require('dw/web/URLUtils');
var endpoint = 'Search-Show';
var collections = require('*/cartridge/scripts/util/collections');

/**
 * @param {dw.catalog.Category} category - Category in which want to count products
 * @returns {number} product count
 */
function getAllProductCount(category) {
    var productCount = 0;
    collections.forEach(category.onlineSubCategories, function (subCat) {
        productCount += getAllProductCount(subCat);
    });
    return productCount + category.products.length;
}
/**
 * @class
 * @classdesc CategorySuggestions class
 * @param {dw.suggest.SuggestModel} suggestions - Suggest Model
 * @param {number} maxItems - Maximum number of categories to retrieve
 */
function CategorySuggestions(suggestions, maxItems) {
    this.categories = [];

    if (!suggestions.categorySuggestions) {
        this.available = false;
        return;
    }

    var categorySuggestions = suggestions.categorySuggestions;
    var iter = categorySuggestions.suggestedCategories;

    this.available = categorySuggestions.hasSuggestions();

    for (var i = 0; i < maxItems; i++) {
        var category = null;

        if (iter.hasNext()) {
            category = iter.next().category;
            this.categories.push({
                name: category.displayName,
                imageUrl: category.image ? category.image.url : '',
                url: URLUtils.url(endpoint, 'cgid', category.ID),
                parentID: category.parent.ID,
                parentName: category.parent.displayName,
                productCount: getAllProductCount(category).toString()
            });
        }
    }
}

module.exports = CategorySuggestions;
