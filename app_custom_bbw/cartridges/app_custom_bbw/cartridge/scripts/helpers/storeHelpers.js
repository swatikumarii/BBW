'use strict';

/**
 * create the stores results html
 * @param {string} radius - radius to be filtered by
 * @param {string} postalCode - postal code, city or state
 * @param {string} lat - coordinate latitude val
 * @param {string} long - coordinate longitude val
 * @param {string} geolocation - geolocation of client
 * @param {string} countryCode - coutryCode searched
 * @param {Array} storeType - filter by store type
 * @param {boolean} showMap - to show map ot not 
 * @param {string} url - url where redirection happen
 * @returns {Array} The list of desired stores
 */
function getStores(radius, postalCode, lat, long, geolocation, countryCode, storeType, showMap, url) {
    var StoresModel = require('*/cartridge/models/stores');
    var StoreMgr = require('dw/catalog/StoreMgr');
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    var SystemObjMgr = require('dw/object/SystemObjectMgr');
    var distanceUnit = 'mi';
    var resolvedRadius = radius ? parseInt(radius, 10) : 15;

    var searchKey = {};
    var storeMgrResult = null;
    var location = {};

    var StoreValues = [];

    var storeTypes =
        SystemObjMgr.describe('Store').attributeDefinitions.toArray();

    /**
     * get store type
     * @param {object} store - store object
     */
    function handleStoreType(store) {
        StoreValues.push({
            value: store.value,
            displayValue: store.displayValue
        });
    }

    /**
     * get store types from stores array.
     * @param {object} item - stores array
     */
    function handleItem(item) {
        if (item.ID === 'storeType') {
            if (item.values) {
                var values = item.values.toArray();
                values.forEach(function (store) {
                    return handleStoreType(store);
                });
            }
        }
    }

    storeTypes.forEach(function (item) {
        return handleItem(item);
    });
    if (resolvedRadius && postalCode && postalCode !== '' && storeType && storeType !== null) {
        // find by postal code
        searchKey = postalCode;
        storeMgrResult = StoreMgr.searchStoresByPostalCode(
            countryCode,
            searchKey,
            distanceUnit,
            resolvedRadius,
            'custom.storeType = {0}',
            storeType
        );
        searchKey = { 
            postalCode: searchKey,
            storeType: storeType
        };
    } else if (resolvedRadius && postalCode && postalCode !== '') {
        // find by postal code
        searchKey = postalCode;
        storeMgrResult = StoreMgr.searchStoresByPostalCode(
            countryCode,
            searchKey,
            distanceUnit,
            resolvedRadius
        );
        searchKey = { postalCode: searchKey };
    } else if (storeType && storeType !== null) {
        // find by coordinates (detect location)
        location.lat = lat && long ? parseFloat(lat) : geolocation.latitude;
        location.long = long && lat ? parseFloat(long) : geolocation.longitude;
        storeMgrResult = StoreMgr.searchStoresByCoordinates(
            location.lat,
            location.long,
            distanceUnit,
            resolvedRadius,
            'custom.storeType = {0}',
            storeType
        );
        searchKey = { lat: location.lat, long: location.long };
    } else {
        // find by coordinates (detect location)
        location.lat = lat && long ? parseFloat(lat) : geolocation.latitude;
        location.long = long && lat ? parseFloat(long) : geolocation.longitude;
        storeMgrResult = StoreMgr.searchStoresByCoordinates(
            location.lat,
            location.long,
            distanceUnit,
            resolvedRadius
        );
        searchKey = { lat: location.lat, long: location.long };
    }

    var actionUrl =
        url || URLUtils.url('Stores-FindStores', 'showMap', showMap).toString();
    var apiKey = Site.getCurrent().getCustomPreferenceValue('mapAPI');

    var stores = new StoresModel(
        storeMgrResult.keySet(),
        searchKey,
        resolvedRadius,
        actionUrl,
        apiKey,
        StoreValues
    );
    return stores;
}

/**
 * create the stores results html
 * @param {Array} storesInfo - an array of objects that contains store information
 * @returns {string} The rendered HTML
 */
function createStoresResultsHtml(storesInfo) {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');

    var context = new HashMap();
    var object = { stores: { stores: storesInfo } };

    Object.keys(object).forEach(function (key) {
        context.put(key, object[key]);
    });

    var template = new Template('storeLocator/storeLocatorResults');
    return template.render(context).text;
}

module.exports = {
    createStoresResultsHtml: createStoresResultsHtml,
    getStores: getStores
};
