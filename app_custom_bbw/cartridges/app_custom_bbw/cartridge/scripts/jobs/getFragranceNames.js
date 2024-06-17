'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var ProductMgr = require('dw/catalog/ProductMgr');

/**
 * @param {Array}  fragranceNamesArray fragrance name array
 * @description This function save the sorted Fragrance Names in custom preference.
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
        var allFragrances;

        while (allProducts.hasNext()) {
            var product = allProducts.next();
            if (product.availabilityModel.availabilityStatus === 'IN_STOCK' && product.online) {
                var productLevelReserveQty =
                'custom' in product &&
                'reserveQty' in product.custom &&
                product.custom.reserveQty
                    ? product.custom.reserveQty
                    : 0;
                var globalLevelReserveQty = dw.system.Site.getCurrent().getCustomPreferenceValue('reserveQty');
                var reserveOosQty = productLevelReserveQty || globalLevelReserveQty;
                var maxOrderQtyByReserveStock = product.availabilityModel.inventoryRecord.ATS.value - reserveOosQty;
                if (maxOrderQtyByReserveStock > 0) {
                    // get fragrance names from all products
                    if (product.custom.fragranceName) {
                        allFragrances = product.custom.fragranceName.split(',');
                        for (var position = 0; position < allFragrances.length; position++) {
                            if (!fragranceNamesArray.includes(allFragrances[position].trim())) {
                                fragranceNamesArray.push(allFragrances[position].trim());
                            }
                        }
                    }
                }
            }
        }

        // Fragrance names that should be visible always
        var essentialFragrances = Site.current.getCustomPreferenceValue('essentialFragrances');
        if (essentialFragrances) {
            var essentialFragrance =  essentialFragrances.split(', ');
            for (var i = 0; i < essentialFragrance.length; i++) {
                if (!fragranceNamesArray.includes(essentialFragrance[i].trim())) {
                    fragranceNamesArray.push(essentialFragrance[i].trim());
                }
            }
        }

        if (fragranceNamesArray.length > 0) {
            saveFragranceNames(fragranceNamesArray);
        } else {
            Site.current.setCustomPreferenceValue('fragranceNames', '');
        }

    } catch (err) {
        Logger.error(err.toString());
    }
}

module.exports = {
    saveFragranceNames: saveFragranceNames,
    getFragranceNames: getFragranceNames
};
