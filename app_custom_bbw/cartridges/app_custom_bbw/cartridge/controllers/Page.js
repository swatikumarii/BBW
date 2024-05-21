'use strict';

/**
 * @namespace Page
 */

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

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
 * function : This point will get breadcrumb for a content asset folder
 * @param {object} folder content folder
 * @returns {object} - returns an element of the array that is breadcrumbs.
 */
function getBreadcrumbForContentAssetFolders(folder) {
    if (folder.ID !== 'faq') {// displayName.
        if (folder.parent !== null) {
            var breadcrumbs = getBreadcrumbForContentAssetFolders(folder.parent);
            if (breadcrumbs) {
                breadcrumbs.push({
                    htmlValue: folder.displayName,
                    url: URLUtils.https('Page-Show', 'cid', folder.ID).toString()
                });
                return breadcrumbs;
            }
        } else {
            return [{
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            }];
        }
    }
    return '';
}

/**
 * function : This point will get breadcrumb for a content asset 
 * @param {object} content content assests
 * @returns {object} - returns an element of the array that is breadcrumbs.
 */
function getBreadcrumbForContentAsset(content) {
    var breadcrumbs = [];
    if (content.folders && content.folders.length > 0) {
        breadcrumbs = getBreadcrumbForContentAssetFolders(content.folders[0]);
    } else {
        breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            }
        ];
    }
    if (breadcrumbs) {
        breadcrumbs.push({
            htmlValue: content.name,
            url: URLUtils.https('Page-Show', 'cid', content.ID).toString()
        });
        return breadcrumbs;
    }
    return '';
}
/**
 * Page-Show : This end point will render a content asset in full storefront page
 * @function
 * @memberof Page
 */
server.append('Show', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var PageMgr = require('dw/experience/PageMgr');
    var ContentModel = require('*/cartridge/models/content');

    var viewData = res.getViewData();

    var page = PageMgr.getPage(req.querystring.cid);

    if (!(page !== null && page.isVisible())) {
        var apiContent = ContentMgr.getContent(req.querystring.cid);
        if (apiContent) {
            var content = new ContentModel(apiContent, 'content/contentAsset');
            var breadcrumbs = getBreadcrumbForContentAsset(apiContent);
            if (content.template) {
                viewData.breadcrumbs = breadcrumbs;
            }
        }
    }
    next();
});

module.exports = server.exports();
