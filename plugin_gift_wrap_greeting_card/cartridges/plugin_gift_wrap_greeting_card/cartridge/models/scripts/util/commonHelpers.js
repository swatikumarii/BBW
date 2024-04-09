/**
 * @File Name          : common.js
 * @Description        : common.js
 * Ver          Modification
 * 1.0          Common functions
 */

'use strict';

var collections = require('*/cartridge/scripts/util/collections');

/**
 * This function macthes passing categoryName with all categories of products and return true is match else false
 * @param {Product} product
 * @param {String} categoryName
 * @returns Boolean
 */
function isCategoryMatches(product, categoryName) {
    var isCategoryMatches = false;
    if (product && product.categories.length > 0) {
        collections.forEach(product.categories, (category) => {
            if (category.ID === categoryName) {
                isCategoryMatches = true;
            }
        });
    }
    return isCategoryMatches;
}

module.exports = {
    isCategoryMatches: isCategoryMatches
};
