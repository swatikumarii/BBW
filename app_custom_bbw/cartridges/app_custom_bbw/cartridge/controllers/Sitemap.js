'use strict';

/**
 * @namespace Site
 */
var server = require('server');

/**
 * Site-Show : The Site-Show endpoint will show categories list
 * @name Site-Show
 */
server.get('Show', function (req, res, next) {
    var catalogMgr = require('dw/catalog/CatalogMgr');
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var siteRootCategory = catalogMgr.getSiteCatalog().getRoot();

    var viewData = res.getViewData();
    var breadcrumbs = [
        {
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        },
        {
            htmlValue: Resource.msg('page.title.sitemap', 'common', null),
            url: URLUtils.url('Sitemap-Show').toString()
        }
    ];
    viewData.breadcrumbs = breadcrumbs;
    res.setViewData(viewData);

    var topLevelCategories = siteRootCategory.hasOnlineSubCategories()
        ? siteRootCategory.getOnlineSubCategories()
        : null;

    res.render('/sitemap/siteMap', { categories: topLevelCategories });
    next();
});

module.exports = server.exports();
