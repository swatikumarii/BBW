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
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    var viewData = res.getViewData();

    var page = PageMgr.getPage(req.querystring.cid);

    if (!(page !== null && page.isVisible())) {
        var apiContent = ContentMgr.getContent(req.querystring.cid);
        if (apiContent) {
            var content = new ContentModel(apiContent, 'content/contentAsset');
            var breadcrumbs = pageMetaHelper.getBreadcrumbForContentAsset(apiContent);
            if (content.template) {
                viewData.breadcrumbs = breadcrumbs;
            }
        }
    }
    next();
});

module.exports = server.exports();
