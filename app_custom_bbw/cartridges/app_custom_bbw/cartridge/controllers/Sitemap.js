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
    var siteRootCategory = catalogMgr.getSiteCatalog().getRoot();

    var topLevelCategories = siteRootCategory.hasOnlineSubCategories()
        ? siteRootCategory.getOnlineSubCategories()
        : null;

    res.render('/sitemap/siteMap', { categories: topLevelCategories });
    next();
});

module.exports = server.exports();
