'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var ProductMgr = require('dw/catalog/ProductMgr');
var HashMap = require('dw/util/HashMap');
var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');

/**
 * performs a search
 * @returns {object} - an object with relevant search information
 */
function search(fragrance) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var ProductSearch = require('*/cartridge/models/search/productSearch');

    var apiProductSearch = new ProductSearchModel();
    var productSearch;
    var httpParameterMap = new HashMap();
    httpParameterMap.put('prefn1', 'fragranceName');
    httpParameterMap.put('prefv1', fragrance);
    httpParameterMap.put('cgid', 's-fragrance');
    var querystring = {
        cgid: 's-fragrance',
        preferences: {
            'fragranceName': fragrance
        }
    }

    apiProductSearch = searchHelper.setupSearch(apiProductSearch, querystring, httpParameterMap);
    apiProductSearch.search();

    if (apiProductSearch.getPromotionIDs()) {
        apiProductSearch.getPromotionIDs().remove('oos-products');
    }

    productSearch = new ProductSearch(
        apiProductSearch,
        querystring,
        querystring.srule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );

    return productSearch;
}

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
 * @param {Object} fragranceCountMap A map with fragrance names as keys and counts as values
 * @description This function saves the sorted Fragrance Names and their counts in custom preference.
 */
function saveFragranceCounts(fragranceCountMap) {
    try {
        // Convert the fragrance count map to a string format to store in the custom preferences
        var fragranceNamesArray = Object.keys(fragranceCountMap).sort();
        var fragranceData = fragranceNamesArray.map(function(fragrance) {
            return fragrance + ' (' + fragranceCountMap[fragrance] + ')';
        }).join(', ');

        Site.current.setCustomPreferenceValue('fragranceNames', fragranceData);
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
        var fragranceCountMap = {};  // Map to store fragrance names and their counts
        var allFragrances;
        var countFragranceEnabled = Site.current.getCustomPreferenceValue('countFragranceEnabled');

        while (allProducts.hasNext()) {
            var product = allProducts.next();
            var isEgiftCard =
                'custom' in product &&
                'isEgiftCard' in product.custom &&
                product.custom.isEgiftCard
                    ? product.custom.isEgiftCard
                    : false;
            if (product.availabilityModel.availabilityStatus === 'IN_STOCK' && product.online && !isEgiftCard) {
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
                    if (product.custom.fragranceName) {
                        allFragrances = product.custom.fragranceName.split(',');
                        for (var position = 0; position < allFragrances.length; position++) {
                            var fragrance = allFragrances[position].trim();
                            if (!fragranceNamesArray.includes(fragrance)) {
                                fragranceNamesArray.push(fragrance);
                                var result = search(fragrance);
                                if (result.count > 0) {
                                    fragranceCountMap[fragrance] = result.count;
                                } else {
                                    fragranceNamesArray.pop();
                                }
                                // Add fragrance to the array if it doesn't exist
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
                    var result = search(essentialFragrance[i].trim());
                    fragranceCountMap[essentialFragrance[i].trim()] = result.count;
                }
            }
        }
        // Save fragrance counts if there are any fragrances found
        if (fragranceNamesArray.length > 0) {
            if(countFragranceEnabled) {
                saveFragranceCounts(fragranceCountMap);
            }
            else {
                saveFragranceNames(fragranceNamesArray);
            }
        } else {
            Site.current.setCustomPreferenceValue('fragranceNames', '');
        }

    } catch (err) {
        Logger.error(err.toString());
    }
}

module.exports = {
    saveFragranceNames: saveFragranceNames,
    getFragranceNames: getFragranceNames,
    saveFragranceCounts: saveFragranceCounts
};
