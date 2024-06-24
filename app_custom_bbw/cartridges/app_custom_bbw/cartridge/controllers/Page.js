'use strict';

/**
 * @namespace Page
 */

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');

/**
 * Page-IncludeHeaderMenu : Append for customer name
 */
server.append(
    'IncludeHeaderMenu',
    server.middleware.include,
    cache.applyDefaultCache,
    function (req, res, next) {
        var viewData = res.getViewData();
        viewData.customerName = req.currentCustomer.profile ? req.currentCustomer.profile.firstName : null;
        res.setViewData(viewData);
        next();
    }
);

/**
 * Page-Show : This end point will render a content asset in full storefront page
 * @function
 * @memberof Page
 */
server.append('Show', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var PageMgr = require('dw/experience/PageMgr');
    var ContentModel = require('*/cartridge/models/content');
    var commonHelper = require('*/cartridge/scripts/helpers/commonHelpers');
    var seoHelper = require('*/cartridge/scripts/helpers/seoHelper');

    var viewData = res.getViewData();

    var page = PageMgr.getPage(req.querystring.cid);

    if (!(page !== null && page.isVisible())) {
        var apiContent = ContentMgr.getContent(req.querystring.cid);
        var canonicalUrl = seoHelper.getCanonicalUrl(
            'Page-Show',
            'cid',
            req.querystring.cid
        );
        if (apiContent) {
            viewData.canonicalUrl = canonicalUrl;
            var content = new ContentModel(apiContent, 'content/contentAsset');
            var breadcrumbs = commonHelper.getBreadcrumbForContentAsset(apiContent);
            if (
                !empty(apiContent) &&
                'image' in apiContent.custom &&
                'absURL' in apiContent.custom.image
            ) {
                viewData.image = apiContent.custom.image.absURL;
            }
            if (content.template && breadcrumbs) {
                viewData.breadcrumbs = breadcrumbs;
                res.setViewData(viewData);
            }
        }
    }
    next();
});

module.exports = server.exports();
