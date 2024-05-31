'use strict';

/**
 * @namespace Stores
 */

var server = require('server');
server.extend(module.superModule);
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');

/**
 * Stores-Find : This endpoint is used to load the Find Stores page
 * @function
 * @memberof Stores
 * @param {middleware} consentTracking
 * @param {querystringparameter} radius - The radius that the shopper selected to refine the search
 * @param {querystringparameter} postalCode - The postal code that the shopper used to search
 * @param {querystringparameter} lat - The latitude of the shopper position
 * @param {querystringparameter} long - The longitude of the shopper position
 * @param {querystringparameter} showMap - A flag indicating whether or not map is to be shown
 * @param {querystringparameter} horizontalView - Boolean value to show map in Horizontal View
 * @param {querystringparameter} isForm - Boolean value to show (or not) the form to Find Stores
 * @param {serverfunction} get
 */
server.append(
    'Find',
    function (req, res, next) {
        var geolocation = req.geolocation;
        var URLUtils = require('dw/web/URLUtils');
        var Resource = require('dw/web/Resource');
        var viewData = res.getViewData;
        var radius = req.querystring.radius;
        var postalCode = req.querystring.postalCode;
        var lat = req.querystring.lat;
        var long = req.querystring.long;
        var showMap = 'true';
        var horizontalView = 'true';
        var isForm = 'true';

        var storeType = req.querystring.storeType;

        var stores = storeHelpers.getStores(
            radius,
            postalCode,
            lat,
            long,
            req.geolocation,
            req.geolocation.countryCode,
            storeType,
            showMap
        );

        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('store.heading', 'storeLocator', null)
            }
        ];
        geolocation = req.geolocation;
        viewData = {
            stores: stores,
            horizontalView: horizontalView,
            isForm: isForm,
            showMap: showMap,
            breadcrumbs: breadcrumbs,
            geolocation: geolocation
        };

        res.render('storeLocator/storeLocator', viewData);
        next();
    }
);

// The req parameter in the unnamed callback function is a local instance of the request object.
// The req parameter has a property called querystring. In this use case the querystring could have the following: lat, long, radius, or postalCode, radius

/**
 * Stores-FindStores : The Stores-FindStores endpoint returns a list of stores that meet the searching criteria
 * @function
 * @memberof Stores
 * @param {querystringparameter} radius - The radius that the shopper selected to refine the search
 * @param {querystringparameter} postalCode - The postal code that the shopper used to search
 * @param {querystringparameter} lat - The latitude of the shopper position
 * @param {querystringparameter} long - The longitude of the shopper position
 * @param {querystringparameter} showMap - A flag indicating whether or not map is to be shown
 * @param {serverfunction} get
 */
server.append('FindStores', function (req, res, next) {
    var radius = req.querystring.radius;
    var postalCode = req.querystring.postalCode;
    var lat = req.querystring.lat;
    var long = req.querystring.long;
    var isNumber = Boolean(Number(postalCode));
    if(!isNumber){
        postalCode = '';
        lat = req.querystring.latitude;
        long = req.querystring.longitude;
    }
    var countryCode = req.querystring.countryCode ? req.querystring.countryCode : null;
    var storeType = req.querystring.storeType;
    var showMap = 'true';

    var stores = storeHelpers.getStores(
        radius,
        postalCode,
        lat,
        long,
        req.geolocation,
        countryCode,
        storeType,
        showMap
    );

    res.json(stores);
    next();
});

/**
 * Stores-Detail : The Stores-FindStores endpoint returns a store and renders a store detail template that meet the searching criteria
 * @function
 * @memberof Stores
 * @param {middleware} https- server.middleware.https
 * @param {middleware} applyDefaultCache- cache.applyDefaultCache
 * @param {middleware} consentTracking- consentTracking
 * @param {querystringparameter} storeId - storeId to get a particular store detail
 * @param {serverfunction} get
 */
server.get('Detail', server.middleware.https, cache.applyDefaultCache, consentTracking.consent, function(req, res, next){
    var storeId = req.querystring.storeId;
    var StoreMgr = require('dw/catalog/StoreMgr');
    var Site = require('dw/system/Site');
    var storeMgrResult = StoreMgr.getStore(storeId);
    var StoreModel = require('*/cartridge/models/store');
    var storeModel = new StoreModel(storeMgrResult);  
    var apiKey = Site.getCurrent().getCustomPreferenceValue('mapAPI');
    var timezone = storeMgrResult.custom.timezone ? storeMgrResult.custom.timezone : Site.getCurrent().getTimezone();
    var storeMapLink = storeMgrResult.custom.storeMapLink;
    var nearbyStores = storeHelpers.getStores(
        30,
        null,
        null,
        null,
        req.geolocation,
        req.geolocation.countryCode,
        '',
        false
    );

    var viewData = {
        storeDetail: storeModel,
        showMap: true,
        googleMapsApi: 'https://maps.googleapis.com/maps/api/js?key=' + apiKey,
        nearbyStores: nearbyStores.stores,
        timezone: timezone,
        storeMapLink: storeMapLink
    };
    viewData.storeDetail.phone = storeMgrResult.phone;
    viewData.storeDetail.email = storeMgrResult.email;
    res.render('storeLocator/storeDetailPage', viewData);
    next();
});
module.exports = server.exports();
