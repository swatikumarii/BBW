'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var ProductMgr = require('dw/catalog/ProductMgr');

/**
 * @param {Array} ingredientNamesArray ingredient name array
 * @description This function save the sorted Ingredients Names in custom preference.
 */
// function saveProductIngredients(ingredientNamesArray) {
//     try {
//         // sort the Ingredients Names array in ascending order
//         var sortedIngredients = ingredientNamesArray
//             .map(function (str) {
//                 return str.replace(/[^a-zA-Z]/g, '').toLowerCase();
//             })
//             .sort()
//             .map(function (cleanStr) {
//                 // Find the original string with the same cleaned string

//                 var originalStr = ingredientNamesArray.find(function (s) {
//                     return (
//                         s.replace(/[^a-zA-Z]/g, '').toLowerCase() === cleanStr
//                     );
//                 });

//                 return originalStr;
//             });

//         // push all unique strings in the first index of the array in comma-separated format
//         var allIngredientsNames = sortedIngredients.join(', ');
//         Site.current.setCustomPreferenceValue(
//             'productIngredients',
//             allIngredientsNames
//         );
//     } catch (err) {
//         Logger.error(err.toString());
//     }
// }

function saveProductIngredients(ingredientNamesArray) {
    try {
        // sort the ingredientNames array in ascending order
        var sortedIngredients = Array.from(ingredientNamesArray).sort();

        // push all strings in comma-separated format
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
 * @description This function is run by the job to get fragrance names list from all products.
 */
function getIngredientNames() {
    try {
        var allProducts = ProductMgr.queryAllSiteProductsSorted();
        var ingredientNamesArray = [];
        var productIngredients;

        while (allProducts.hasNext()) {
            var product = allProducts.next();
            // if (product.availabilityModel.availabilityStatus === 'IN_STOCK' && product.online) {
                
            //     // get ingredients from all products
            //     if (product.custom.ingredients) {
            //         productIngredients = product.custom.ingredients;
            //         for (var index = 0; index < productIngredients.length; index++) {
            //             if (!ingredientNamesArray.includes(productIngredients[index])) {
            //                 ingredientNamesArray.push(productIngredients[index]);
            //             }
            //         }
            //     }
            // }
            if (product.availabilityModel.availabilityStatus === 'IN_STOCK' && product.online) {
                var productLevelReserveQty =
                'custom' in product &&
                'reserveQty' in product.custom &&
                product.custom.reserveQty
                    ? product.custom.reserveQty
                    : 0;
                var globalLevelReserveQty = dw.system.Site.getCurrent().getCustomPreferenceValue('reserveQty');
                var reserveOosQty = productLevelReserveQty || globalLevelReserveQty;
                var maxOrderQtyByReserveStock = 0;
                if (product.availabilityModel && product.availabilityModel.inventoryRecord) {
                    maxOrderQtyByReserveStock = (product.availabilityModel.inventoryRecord.ATS.value ? product.availabilityModel.inventoryRecord.ATS.value : 0) - reserveOosQty;
                }
                if (maxOrderQtyByReserveStock > 0) {
                    // get ingredients from all products
                    if (product.custom.ingredients) {
                        productIngredients = product.custom.ingredients;
                        for (var index = 0; index < productIngredients.length; index++) {
                            if (!ingredientNamesArray.includes(productIngredients[index])) {
                                ingredientNamesArray.push(productIngredients[index]);
                            }
                        }
                    }
                }
            }
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
    getIngredientNames: getIngredientNames
};
