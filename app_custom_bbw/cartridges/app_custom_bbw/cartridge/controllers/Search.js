'use strict';

var server = require('server');
server.extend(module.superModule);
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var categoryHelper = require('*/cartridge/scripts/helpers/categoryHelper');

server.append(
    'Show',
    categoryHelper.appendLevelOneCategory,
    categoryHelper.appendCategoryBreadcrum
);
server.append(
    'ShowAjax',
    categoryHelper.appendLevelOneCategory,
    categoryHelper.appendCategoryBreadcrum
);
server.append(
    'UpdateGrid',
    categoryHelper.appendLevelOneCategory,
    categoryHelper.appendCategoryBreadcrum
);


/**
 * Search-FaqContent : This endpoint is called when a shopper search for something under articles by clicking on the articles tab next to products on Search result page
 * Search-FaqContent
 */
server.get('FaqContent', cache.applyDefaultCache, consentTracking.consent, function (req, res, next) {
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var contentSearch = searchHelper.setupFaqContentSearch(req.querystring);
    res.render('/search/contentGrid', {
        contentSearch: contentSearch
    });
    next();
});

module.exports = server.exports();
