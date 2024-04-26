'use strict';

/**
 * @namespace Site
 */
var server = require('server');

/**
 * Site-Map : The Site-Map endpoint will show categories list
 * @name Site-Map
 */
server.get('Map', function (req, res, next) {
    var catalogMgr = require('dw/catalog/CatalogMgr');
    var siteRootCategory = catalogMgr.getSiteCatalog().getRoot();

    var topLevelCategories = siteRootCategory.hasOnlineSubCategories()
        ? siteRootCategory.getOnlineSubCategories()
        : null;

    res.render('/site/siteMap', { categories: topLevelCategories });
    next();
});

module.exports = server.exports();
