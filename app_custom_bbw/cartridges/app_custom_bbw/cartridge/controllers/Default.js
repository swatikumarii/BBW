'use strict';

/**
 * @namespace Default
 */

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

/** when sitepath is defined in the site aliases from business manager, homepage will be rendered directly */
/**
 * Default-Start : This end point is the root of the site, when opening from the BM this is the end point executed
 * @function
 * @memberof Default
 * @param {middleware} consent - consentTracking.consent
 * @param {middleware} applyDefaultCache - cache.applyDefaultCache
 * @param {category} category - non-sensitive
 * @param {renders} isml - isml
 * @param {serverfunction} get - get
 */
server.replace(
    'Start',
    consentTracking.consent,
    cache.applyDefaultCache,
    function (req, res, next) {
        var Site = require('dw/system/Site');
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

module.exports = server.exports();
