/* eslint-disable */
'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var searchRefinementsFactory = require('*/cartridge/scripts/factories/searchRefinements');
var URLUtils = require('dw/web/URLUtils');
var preferences = require('*/cartridge/config/preferences');
var ProductSortOptions = require('*/cartridge/models/search/productSortOptions');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');

var ACTION_ENDPOINT = 'Search-Show';
var ACTION_ENDPOINT_AJAX = 'Search-ShowAjax';
var DEFAULT_PAGE_SIZE = preferences.defaultPageSize
    ? preferences.defaultPageSize
    : 12;

/**
 * Generates URL that removes refinements, essentially resetting search criteria
 * @param {dw.catalog.ProductSearchModel} search - Product search object
 * @param {object} httpParams - Query params
 * @param {string} [httpParams.q] - Search keywords
 * @param {string} [httpParams.cgid] - Category ID
 * @param {string} actionEndpoint - the action endpoint to use
 * @returns {string} - URL to reset query to original search
 */
function getResetLink(search, httpParams, actionEndpoint) {
    var endpoint = actionEndpoint || ACTION_ENDPOINT_AJAX;
    return search.categorySearch
        ? URLUtils.url(endpoint, 'cgid', httpParams.cgid)
        : URLUtils.url(endpoint, 'q', httpParams.q);
}

/**
 * Retrieves search refinements
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {dw.catalog.ProductSearchRefinements} refinements - Search refinements
 * @param {ArrayList.<dw.catalog.ProductSearchRefinementDefinition>} refinementDefinitions - List of
 *     product serach refinement definitions
 * @returns {Refinement[]} - List of parsed refinements
 */
function getRefinements(productSearch, refinements, refinementDefinitions) {
    return collections.map(refinementDefinitions, function (definition) {
        var refinementValues = refinements.getAllRefinementValues(definition);
        var values = searchRefinementsFactory.get(
            productSearch,
            definition,
            refinementValues
        );

        return {
            id: definition.attributeID,
            displayName: definition.displayName,
            isCategoryRefinement: definition.categoryRefinement,
            isAttributeRefinement: definition.attributeRefinement,
            isPriceRefinement: definition.priceRefinement,
            isPromotionRefinement: definition.promotionRefinement,
            values: values
        };
    });
}

/**
 * Returns the refinement values that have been selected
 * @param {Array.<CategoryRefinementValue|AttributeRefinementValue|PriceRefinementValue>}
 *     refinements - List of all relevant refinements for this search
 * @param refinements
 * @returns {object[]} - List of selected filters
 */
function getSelectedFilters(refinements) {
    var selectedFilters = [];
    var selectedValues = [];

    refinements.forEach(function (refinement) {
        selectedValues = refinement.values.filter(function (value) {
            return value.selected;
        });
        if (selectedValues.length) {
            selectedFilters.push.apply(selectedFilters, selectedValues);
        }
    });

    return selectedFilters;
}

/**
 * Configures and returns a PagingModel instance
 * @param {dw.util.Iterator} productHits - Iterator for product search results
 * @param {number} count - Number of products in search results
 * @param {number} pageSize - Number of products to display
 * @param {number} startIndex - Beginning index value
 * @returns {dw.web.PagingModel} - PagingModel instance
 */
function getPagingModel(productHits, count, pageSize, startIndex) {
    var PagingModel = require('dw/web/PagingModel');
    var paging = new PagingModel(productHits, count);

    paging.setStart(startIndex || 0);
    paging.setPageSize(pageSize || DEFAULT_PAGE_SIZE);

    return paging;
}

/**
 * Generates URL for [Show] More button
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {object} httpParams - HTTP query parameters
 * @returns {string} - More button URL
 */
function getShowMoreUrl(productSearch, httpParams) {
    var showMoreEndpoint = 'Search-UpdateGrid';
    var currentStart = httpParams.start || 0;
    var pageSize = httpParams.sz || DEFAULT_PAGE_SIZE;
    var hitsCount = productSearch.count;
    var nextStart;

    var paging = getPagingModel(
        productSearch.productSearchHits,
        hitsCount,
        DEFAULT_PAGE_SIZE,
        currentStart
    );

    if (pageSize >= hitsCount) {
        return '';
    }
    if (pageSize > DEFAULT_PAGE_SIZE) {
        nextStart = pageSize;
    } else {
        var endIdx = paging.getEnd();
        nextStart = endIdx + 1 < hitsCount ? endIdx + 1 : null;

        if (!nextStart) {
            return '';
        }
    }

    paging.setStart(nextStart);

    var baseUrl = productSearch.url(showMoreEndpoint);
    var finalUrl = paging.appendPaging(baseUrl);
    return finalUrl;
}

/**
 * Forms a URL that can be used as a permalink with filters, sort, and page size preserved
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {number} pageSize - 'sz' query param
 * @param {number} startIdx - 'start' query param
 * @returns {string} - Permalink URL
 */
function getPermalink(productSearch, pageSize, startIdx) {
    var showMoreEndpoint = 'Search-Show';
    var params = { start: '0', sz: pageSize + startIdx };
    var url = productSearch.url(showMoreEndpoint).toString();
    var appended = urlHelper.appendQueryParams(url, params).toString();
    return appended;
}

/**
 * Compile a list of relevant suggested phrases
 * @param {dw.util.Iterator.<dw.suggest.SuggestedPhrase>} suggestedPhrases - Iterator to retrieve suggestedPhrases
 * @returns {SuggestedPhrase[]} - Array of suggested phrases
 */
function getPhrases(suggestedPhrases) {
    var phrase = null;
    var phrases = [];

    while (suggestedPhrases.hasNext()) {
        phrase = suggestedPhrases.next();
        phrases.push({
            value: phrase.phrase,
            url: URLUtils.url(ACTION_ENDPOINT, 'q', phrase.phrase)
        });
    }
    return phrases;
}

/**
 * Generates Pagination links
 * @param {dw/catalog/ProductSearchModel} productSearch
 * @param {dw/web/PagingModel} currentPaging - Paging model for search result
 * @param {number} pageSize
 * @returns {object} - Pagination data and links
 */
function getPaginationLinks(productSearch, currentPaging, pageSize) {
    var currentPageIndex = currentPaging.getCurrentPage();
    var currentPageNumber = currentPageIndex + 1;

    var paginationLinks = [];

    // First page - reset paging
    var paging = currentPaging;
    paging.setStart(0);
    paging.setPageSize(pageSize);
    var pageCount = paging.pageCount;

    var showMoreEndpoint = 'Search-Show';
    var baseUrl = productSearch.url(showMoreEndpoint);

    // Generate all pages links
    for (var pageNumber = 1; pageNumber <= pageCount; ++pageNumber) {
        var finalUrl = paging.appendPaging(baseUrl).append('page', pageNumber);

        if (pageNumber === 1) {
            finalUrl.remove('page');
            finalUrl.remove('start');
            finalUrl.remove('sz');
        }
        paginationLinks.push({
            url: finalUrl,
            active: pageNumber === currentPageNumber
        });

        // Prepare for next loop
        paging.setStart(paging.getEnd() + 1);
        paging.setPageSize(pageSize);
    }

    return {
        currentPageNumber: currentPageNumber,
        firstLink: paginationLinks[0],
        lastLink: paginationLinks[paginationLinks.length - 1],
        prevLink: pageCount > 1 ? paginationLinks[currentPageIndex - 1] : null,
        nextLink:
            pageCount > currentPageNumber
                ? paginationLinks[currentPageIndex + 1]
                : null,
        allLinks: paginationLinks
    };
}

/**
 * @class
 * @classdesc ProductSearch class
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {object} httpParams - HTTP query parameters
 * @param {string} sortingRule - Sorting option rule ID
 * @param {dw.util.ArrayList.<dw.catalog.SortingOption>} sortingOptions - Options to sort search
 *     results
 * @param {dw.catalog.Category} rootCategory - Search result's root category if applicable
 */
function ProductSearch(
    productSearch,
    httpParams,
    sortingRule,
    sortingOptions,
    rootCategory
) {
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');

    this.pageSize = parseInt(httpParams.sz, 10) || DEFAULT_PAGE_SIZE;
    this.productSearch = productSearch;
    var startIdx = httpParams.start || 0;
    var paging = getPagingModel(
        productSearch.productSearchHits,
        productSearch.count,
        this.pageSize,
        startIdx
    );

    var searchSuggestions = productSearch.searchPhraseSuggestions;
    this.isSearchSuggestionsAvailable = searchSuggestions
        ? searchSuggestions.hasSuggestedPhrases()
        : false;

    if (this.isSearchSuggestionsAvailable) {
        this.suggestionPhrases = getPhrases(searchSuggestions.suggestedPhrases);
    }

    this.pageNumber = paging.currentPage;
    this.count = productSearch.count;
    this.isCategorySearch = productSearch.categorySearch;
    this.isRefinedCategorySearch = productSearch.refinedCategorySearch;
    this.searchKeywords = productSearch.searchPhrase;

    this.resetLink = getResetLink(
        productSearch,
        httpParams,
        ACTION_ENDPOINT_AJAX
    );
    this.resetLinkSeo = getResetLink(
        productSearch,
        httpParams,
        ACTION_ENDPOINT
    );
    this.bannerImageUrl = productSearch.category
        ? searchHelper.getBannerImageUrl(productSearch.category)
        : null;
    var productIds = collections.map(paging.pageElements, function (item) {
        if (
            item.product.availabilityModel.inventoryRecord.ATS.value -
                item.product.custom.reserveQty <=
            0
        ) {
            return false;
        } else {
            return {
                productID: item.productID,
                productSearchHit: item
            };
        }
    });
    this.productIds = productIds.filter(function (item) {
        return item != false;
    });
    this.productSort = new ProductSortOptions(
        productSearch,
        sortingRule,
        sortingOptions,
        rootCategory,
        paging
    );
    this.showMoreUrl = getShowMoreUrl(productSearch, httpParams);
    this.permalink = getPermalink(
        productSearch,
        parseInt(this.pageSize, 10),
        parseInt(startIdx, 10)
    );

    if (productSearch.category) {
        this.category = {
            name: productSearch.category.displayName,
            id: productSearch.category.ID,
            pageTitle: productSearch.category.pageTitle,
            pageDescription: productSearch.category.pageDescription,
            pageKeywords: productSearch.category.pageKeywords
        };
    }
    this.pageMetaTags = productSearch.pageMetaTags;

    if (!require('*/cartridge/config/seoPreferences').enablePLPPagination) {
        return;
    }

    this.paginationDetails = getPaginationLinks(
        productSearch,
        getPagingModel(
            productSearch.productSearchHits,
            productSearch.count,
            this.pageSize,
            parseInt(httpParams.start, 10) || 0
        ),
        this.pageSize
    );
}

Object.defineProperty(ProductSearch.prototype, 'refinements', {
    get: function () {
        if (!this.cachedRefinements) {
            this.cachedRefinements = getRefinements(
                this.productSearch,
                this.productSearch.refinements,
                this.productSearch.refinements.refinementDefinitions
            );
        }

        return this.cachedRefinements;
    }
});

Object.defineProperty(ProductSearch.prototype, 'selectedFilters', {
    get: function () {
        return getSelectedFilters(this.refinements);
    }
});

module.exports = ProductSearch;
