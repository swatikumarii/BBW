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
    var hideFilterBar = false;

    if (viewData.productSearch && viewData.productSearch.refinements.length > 0) {
        var countvalue = 0;
        for (var i = 0; i < viewData.productSearch.refinements.length; i++) {
            if (viewData.productSearch.refinements[i].values && viewData.productSearch.refinements[i].values.length < 2) {
                countvalue++;
            }
        }
        if (countvalue === viewData.productSearch.refinements.length) {
            hideFilterBar = true;
        }
    }
    viewData.hideFilterBar = hideFilterBar;
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
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var viewData = res.getViewData();
    var breadcrumbs = [];
    if (req.querystring.cgid === 's-fragrance' && 'preferences' in req.querystring) {
        if ('fragranceName' in req.querystring.preferences) {
            var category = CatalogMgr.getCategory(req.querystring.cgid);
            if (category) {
                breadcrumbs = [
                    {
                        htmlValue: req.querystring.preferences.fragranceName
                            ? req.querystring.preferences.fragranceName
                            : ''
                    },
                    {
                        htmlValue: category.displayName,
                        url: URLUtils.url('Fragrance-Show')
                    }
                ];
            }
        }
    }else{
        breadcrumbs = productHelper.getAllBreadcrumbs(
            req.querystring.cgid,
            null,
            []
        );
    }
    if (!viewData.productSearch.isCategorySearch && viewData.productSearch.searchKeywords) {
        breadcrumbs.push({
            htmlValue: Resource.msgf('search.result.breadcrumb', 'search', null, viewData.productSearch.searchKeywords)
        });
    }
    if (breadcrumbs.length > 0) {
        breadcrumbs.push({
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        });
    }

    breadcrumbs = breadcrumbs.reverse();

    viewData.breadcrumbs = breadcrumbs;
    res.setViewData(viewData);
    next();
}

module.exports = {
    appendLevelOneCategory: appendLevelOneCategory,
    appendCategoryBreadcrum: appendCategoryBreadcrum
};
