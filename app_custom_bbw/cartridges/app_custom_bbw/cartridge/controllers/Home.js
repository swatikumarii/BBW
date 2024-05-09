'use strict';

/**
 * @namespace Home
 */

var server = require('server');
server.extend(module.superModule);
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var Site = require('dw/system/Site');

/**
 * Home-CountrySelector : The Home-CountrySelector endpoint returns a list of website that user can browse instead of browsing the one he opened
 * @function
 * @memberof Home
 * @param {middleware} https- server.middleware.https
 * @param {middleware} applyDefaultCache- cache.applyDefaultCache
 * @param {middleware} consentTracking- consentTracking
 * @param {serverfunction} get
 */
server.get(
    'CountrySelector',
    server.middleware.https,
    cache.applyDefaultCache,
    consentTracking.consent,
    function (req, res, next) {
        var countrySiteMapping =
            Site.current.getCustomPreferenceValue('countrySiteMapping');
        countrySiteMapping = JSON.parse(countrySiteMapping);
        var siteCountryCode = Site.current.defaultLocale;
        siteCountryCode = siteCountryCode.split('_');
        siteCountryCode = siteCountryCode[1];
        var reqCountryCode = req.geolocation.countryCode;
        if (!(siteCountryCode === reqCountryCode)) {
            res.render('/common/countrySelector', {
                reqCountryCode: reqCountryCode,
                siteCountryCode: siteCountryCode,
                countrySiteMapping: countrySiteMapping
            });
        }
        next();
    }
);
module.exports = server.exports();
