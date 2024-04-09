/**
 * File Name          : commonHelpers.js
 * Description        : commonHelpers.js
 * Ver          Modification
 * 1.0          Common functions
 */

'use strict';

var collections = require('*/cartridge/scripts/util/collections');

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

module.exports = {
    isCategoryMatches: isCategoryMatches
};
