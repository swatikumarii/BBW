'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var ProductMgr = require('dw/catalog/ProductMgr');


/**
 * @description This function is run by the job to get fragrance names list from all products.
 */
function getFragranceNames() {
    try {
        var allProducts = ProductMgr.queryAllSiteProductsSorted();

        var allFragrances = [];

        while (allProducts.hasNext()) {
            var products = allProducts.next();
            if (products.custom.fragranceName) {
                if (!allFragrances.includes(products.custom.fragranceName)) {
                    allFragrances.push(products.custom.fragranceName);
                }
            }
        }

        if(allFragrances.length > 0){
            var fragranceNamesArray = Object.values(allFragrances).reduce((acc, fragrances) => {
                fragrances.split(',').forEach(fragrance => {
                    acc.add(fragrance.trim());

                });

                return acc;

            }, new Set());


            // sort the fragranceNames array in ascending order
            var sortedFragranceNames = Array.from(fragranceNamesArray).sort();


            // push all unique strings in the first index of the array in comma-separated format
            var allFragranceNames = [sortedFragranceNames.join(', ')];
            Site.current.setCustomPreferenceValue('fragranceNames', allFragranceNames[0]);
        }else{
            Site.current.setCustomPreferenceValue('fragranceNames', '');
        }

    } catch (err) {
        Logger.error(err.toString());
    }

}

module.exports = {
    getFragranceNames: getFragranceNames
};

