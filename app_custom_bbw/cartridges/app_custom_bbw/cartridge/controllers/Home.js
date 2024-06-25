'use strict';

/**
 * @namespace Home
 */

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

var Site = require('dw/system/Site');

/**
 * Any customization on this endpoint, also requires update for Default-Start endpoint
 */
/**
 * Home-Show : This endpoint is called when a shopper navigates to the home page
 * @function
 * @memberof Home
 * @param {middleware} consent - consentTracking.consent
 * @param {middleware} applyDefaultCache- cache.applyDefaultCache
 * @param {category} category - non-sensitive
 * @param {renders} isml - isml
 * @param {serverfunction} get - get
 */
server.replace(
    'Show',
    consentTracking.consent,
    cache.applyDefaultCache,
    function (req, res, next) {
        var PageMgr = require('dw/experience/PageMgr');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

        pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);

        var pageDesignerID = (
            Site.current.getCustomPreferenceValue('pageDesignerID') || ''
        ).split(',');

        var page = PageMgr.getPage('homepage');

        for (var i = 0; i < pageDesignerID.length; i++) {
            if (!empty(pageDesignerID[i])) {
                var pdPage = PageMgr.getPage(pageDesignerID[i]);
                if (pdPage && pdPage.visible) {
                    page = pdPage;
                    break;
                }
            }
        }

        if (page && page.isVisible()) {
            res.page(page.ID);
        } else {
            res.render('home/homePage');
        }
        next();
    },
    pageMetaData.computedPageMetaData
);

/**
 * Home-CountrySelector : The Home-CountrySelector endpoint returns a list of website that user can browse instead of browsing the one he opened
 * @function
 * @memberof Home
 * @param {middleware} https- server.middleware.https
 * @param {serverfunction} get
 */
server.get(
    'CountrySelector',
    server.middleware.https,
    function (req, res, next) {
        var countrySiteMapping =
            Site.current.getCustomPreferenceValue('countrySiteMapping');
        countrySiteMapping = JSON.parse(countrySiteMapping);
        var siteCountryCode = Site.current.defaultLocale;
        siteCountryCode = siteCountryCode.split('_');
        siteCountryCode = siteCountryCode[1];
        var reqCountryCode = req.geolocation.countryCode;
        res.render('/common/countrySelector', {
            reqCountryCode: reqCountryCode,
            siteCountryCode: siteCountryCode,
            countrySiteMapping: countrySiteMapping
        });
        next();
    }
);

module.exports = server.exports();
