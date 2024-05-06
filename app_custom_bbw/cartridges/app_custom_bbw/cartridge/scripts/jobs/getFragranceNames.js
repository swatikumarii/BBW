'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var ProductMgr = require('dw/catalog/ProductMgr');
var StringUtils = require('dw/util/StringUtils');

/**
 * @param {Array} ingredientNamesArray ingredient name array
 * @description This function save the sorted Ingredients Names in custom preference.
 */
function saveProductIngredients(ingredientNamesArray) {
    try {
        // sort the Ingredients Names array in ascending order
        var sortedIngredients = ingredientNamesArray
            .map(function (str) {
                return str.replace(/[^a-zA-Z]/g, '').toLowerCase();
            })
            .sort()
            .map(function (cleanStr) {
                // Find the original string with the same cleaned string

                var originalStr = ingredientNamesArray.find(function (s) {
                    return (
                        s.replace(/[^a-zA-Z]/g, '').toLowerCase() === cleanStr
                    );
                });

                return originalStr;
            });

        // push all unique strings in the first index of the array in comma-separated format
        var allIngredientsNames = sortedIngredients.join(', ');
        Site.current.setCustomPreferenceValue(
            'productIngredients',
            allIngredientsNames
        );
    } catch (err) {
        Logger.error(err.toString());
    }
}

/**
 * @param {Array}  fragranceNamesArray fragrance name array
 * @description This function save the sorted Ingredients Names in custom preference.
 */
function saveFragranceNames(fragranceNamesArray) {
    try {
        // sort the fragranceNames array in ascending order
        var sortedFragranceNames = Array.from(fragranceNamesArray).sort();

        // push all strings in comma-separated format
        var allFragranceNames = sortedFragranceNames.join(', ');
        Site.current.setCustomPreferenceValue(
            'fragranceNames',
            allFragranceNames
        );
    } catch (err) {
        Logger.error(err.toString());
    }
}
/**
 * @description This function is run by the job to get fragrance names list from all products.
 */
function getFragranceNames() {
    try {
        var allProducts = ProductMgr.queryAllSiteProductsSorted();
        var fragranceNamesArray = [];
        var ingredientNamesArray = [];
        var allIngredients;
        var productIngredients;
        var allFragrances;

        while (allProducts.hasNext()) {
            var product = allProducts.next();
            if (product.availabilityModel.availabilityStatus === 'IN_STOCK' && product.online) {

                // get fragrance names from all products
                if (product.custom.fragranceName) {
                    allFragrances = product.custom.fragranceName.split(',');
                    for (var position = 0; position < allFragrances.length; position++) {
                        if (!fragranceNamesArray.includes(allFragrances[position].trim())) {
                            fragranceNamesArray.push(allFragrances[position].trim());
                        }
                    }
                }

                // get ingredients from all products
                if (product.custom.ingredients) {
                    productIngredients = StringUtils.trim(product.custom.ingredients);
                    allIngredients = productIngredients.split(',');
                    for (var index = 0; index < allIngredients.length; index++) {
                        if (!ingredientNamesArray.includes(allIngredients[index])) {
                            ingredientNamesArray.push(allIngredients[index]);
                        }
                    }
                }
            }
        }

        if (fragranceNamesArray.length > 0) {
            saveFragranceNames(fragranceNamesArray);
        } else {
            Site.current.setCustomPreferenceValue('fragranceNames', '');
        }

        if (ingredientNamesArray.length > 0) {
            saveProductIngredients(ingredientNamesArray);
        } else {
            Site.current.setCustomPreferenceValue('productIngredients', '');
        }
    } catch (err) {
        Logger.error(err.toString());
    }
}

module.exports = {
    saveProductIngredients: saveProductIngredients,
    saveFragranceNames: saveFragranceNames,
    getFragranceNames: getFragranceNames
};
