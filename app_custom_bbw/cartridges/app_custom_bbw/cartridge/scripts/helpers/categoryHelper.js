'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var searchHelpers = require('*/cartridge/scripts/helpers/searchHelpers');
/**
 * 
 * @param {*} categoryName  category name
 * @param {*} res  The response object for the current controller request
 * @returns if product is in stock then true else false
 */
function isProductIDsAvailableByCategoryName(categoryName, res){
    var productIds = searchHelpers.getOnlineProductsByCategory(categoryName, res);
    return productIds && productIds.length > 0;
}
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
        var levelOneCategory = getLevelOneCategory(
            viewData.apiProductSearch.category
        );
        var levelTwoCategories = [];
        collections.forEach(levelOneCategory.onlineSubCategories, function (subCat2) {
            if (subCat2.custom && subCat2.custom.showInMenu
                && subCat2.hasOnlineSubCategories() && isProductIDsAvailableByCategoryName(subCat2.ID, res)) {
                    var levelThreeCategories = [];
                    collections.forEach(subCat2.onlineSubCategories, function (subCat) {
                        if (subCat.custom && subCat.custom.showInMenu && 
                            subCat.products.empty === false && subCat.onlineProducts.empty === false && isProductIDsAvailableByCategoryName(subCat.ID, res)) {
                            levelThreeCategories.push({
                                'ID': subCat.ID,
                                'displayName': subCat.displayName,
                                'absURL': subCat.thumbnail ? subCat.thumbnail.absURL : '',
                                'isShowCategoryInSlider': subCat.custom.showCategoryInSlider == null || subCat.custom.showCategoryInSlider
                            });
                        }
                    });
                    levelTwoCategories.push({
                        'ID': subCat2.ID,
                        'displayName': subCat2.displayName,
                        'levelThreeCategories': levelThreeCategories
                    });
            }
        });
        viewData.productSearch.levelOneCategory = {
            slotId: levelOneCategory.custom.slotId,
            levelTwoCategories: levelTwoCategories
        };
        res.setViewData(viewData);
    }
    var hideFilterBar = false;

    if (viewData.productSearch && viewData.productSearch.refinements.length > 0) {
        var countvalue = 0;
        var ingredient = 'ingredients';
        var giftcard = 'isEgiftCard';
        var filteredRefinements = viewData.productSearch.refinements.filter((item) => item.id !== ingredient && item.id !== giftcard);
        Object.defineProperty(viewData.productSearch, 'refinements', { value: filteredRefinements });
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
    res.setViewData(viewData);
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
    // if (!viewData.productSearch.isCategorySearch && viewData.productSearch.searchKeywords) {
    //     breadcrumbs.push({
    //         htmlValue: Resource.msgf('search.result.breadcrumb', 'search', null, viewData.productSearch.searchKeywords)
    //     });
    // }

    breadcrumbs = breadcrumbs.reverse();

    viewData.breadcrumbs = breadcrumbs;
    viewData.cgid = req.querystring.cgid;
    res.setViewData(viewData);
    next();
}

module.exports = {
    appendLevelOneCategory: appendLevelOneCategory,
    appendCategoryBreadcrum: appendCategoryBreadcrum
};
