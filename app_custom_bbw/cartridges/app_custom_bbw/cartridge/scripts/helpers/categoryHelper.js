'use strict';


/**
 * get level one category
 * @param  {object} category category
 * @returns  {Array} category level one
 */
function getLevelOneCategory(category) {
    if (category.parent.ID === 'root') {
        return category;
    }
    return getLevelOneCategory(category.parent);
}

/**
 * append level one category to the viewData
 * @param {object} req - The request object for the current controller request
 * @param {object} res - The response object for the current controller request
 * @param {Function} next - Executes the next step in the controller chain
 */
function appendLevelOneCategory(req, res, next) {
    var viewData = res.getViewData();
    if (viewData.apiProductSearch && viewData.apiProductSearch.category) {
        viewData.productSearch.levelOneCategory = getLevelOneCategory(
            viewData.apiProductSearch.category
        );
        res.setViewData(viewData);
    }
    next();
}

/**
 * append category breadcrumbs to the viewData
 * @param {object} req - The request object for the current controller request
 * @param {object} res - The response object for the current controller request
 * @param {Function} next - Executes the next step in the controller chain
 */
function appendCategoryBreadcrum(req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var viewData = res.getViewData();
    var breadcrumbs = productHelper.getAllBreadcrumbs(
        req.querystring.cgid,
        null,
        []
    );
    breadcrumbs.push({
        htmlValue: Resource.msg('global.home', 'common', null),
        url: URLUtils.home().toString()
    });
    breadcrumbs = breadcrumbs.reverse();

    viewData.breadcrumbs = breadcrumbs;
    res.setViewData(viewData);
    next();
}

/**
 * append search breadcrumbs to the viewData
 * @param {object} req - The request object for the current controller request
 * @param {object} res - The response object for the current controller request
 * @param {Function} next - Executes the next step in the controller chain
 */
function appendSearchBreadcrum(req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var viewData = res.getViewData();
    var breadcrumbs = [
        {
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        },
        {
            htmlValue: Resource.msgf('breadcrumb.your.search.results', 'search', null,
                viewData.productSearch.searchKeywords)
        }
    ];

    viewData.breadcrumbs = breadcrumbs;
    res.setViewData(viewData);
    next();
}

module.exports = {
    appendLevelOneCategory: appendLevelOneCategory,
    appendCategoryBreadcrum: appendCategoryBreadcrum,
    appendSearchBreadcrum: appendSearchBreadcrum
};
