'use strict';

var base = module.superModule;

var ArrayList = require('dw/util/ArrayList');
var PromotionMgr = require('dw/campaign/PromotionMgr');

/**
 * Sets the relevant product search model properties, depending on the parameters provided
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {object} httpParams - Query params
 * @param {dw.catalog.Category} selectedCategory - Selected category
 * @param {dw.catalog.SortingRule} sortingRule - Product grid sort rule
 * @param {object} httpParameterMap - Query params
 * @property {number[]} httpParameterMap {pmin, pmax}- Minimum Price
 */
function setProductProperties(productSearch, httpParams, selectedCategory, sortingRule, httpParameterMap) {
    var searchPhrase;

    if (httpParams.q) {
        searchPhrase = httpParams.q;
        productSearch.setSearchPhrase(searchPhrase);
    }
    if (selectedCategory) {
        productSearch.setCategoryID(selectedCategory.ID);
    }
    if (httpParams.pid) {
        productSearch.setProductIDs([httpParams.pid]);
    }
    if (httpParameterMap) {
        if (httpParameterMap.pmin) {
            productSearch.setPriceMin(httpParameterMap.pmin.doubleValue);
        }
        if (httpParameterMap.pmax) {
            productSearch.setPriceMax(httpParameterMap.pmax.doubleValue);
        }
    }
    var promotions = new ArrayList();
    if (httpParams.pmid) {
        promotions.push(httpParams.pmid);
    }
    var promotion = PromotionMgr.getPromotion('oos-products');
    if (promotion) {
        promotions.push(promotion.ID);
    }
    productSearch.setPromotionIDs(promotions);

    if (sortingRule) {
        productSearch.setSortingRule(sortingRule);
    }
    // if (selectedCategory && 'custom' in selectedCategory && selectedCategory.custom && 'isEGiftCategory' in selectedCategory.custom && selectedCategory.custom.isEGiftCategory) {
    //     productSearch.setRefinementValues('isEgiftCard', 'true');
    // } else {
    //     productSearch.setRefinementValues('isEgiftCard', 'false');
    // }
    productSearch.setRefinementValues('isProductSearchable', 'true');
    productSearch.setRecursiveCategorySearch(true);
}

module.exports = {
    setProductProperties: setProductProperties
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
