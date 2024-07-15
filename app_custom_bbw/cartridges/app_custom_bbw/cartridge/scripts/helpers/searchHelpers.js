'use strict';

var base = module.superModule;

/**
 * Set content search configuration values
 * @param {object} params - Provided HTTP query parameters
 * @returns {object} - content search instance
 */
function setupFaqContentSearch(params) {
    var Resource = require('dw/web/Resource');
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentSearchModel = require('dw/content/ContentSearchModel');
    var ContentSearch = require('*/cartridge/models/search/faqContentSearch');
    var faqFolder = ContentMgr.getFolder('faq');
    var folders = [];

    var apiContentSearchModel = new ContentSearchModel();

    apiContentSearchModel.setFolderID(faqFolder.ID);
    apiContentSearchModel.setRecursiveFolderSearch(true);
    apiContentSearchModel.setFilteredByFolder(true);
    apiContentSearchModel.setSearchPhrase(params.query);
    apiContentSearchModel.search();
    var allResultCount = Number(apiContentSearchModel.getCount());
    var contentSearch = null;
    var contentSearchResult = null;
    var selectedCategoryResultCount = 0;
    var selectedCategoryName;
    var selectedCategoryId;
    if (!params.categoryId) {
        selectedCategoryResultCount = allResultCount;
        contentSearchResult = apiContentSearchModel.getContent();
        contentSearch = new ContentSearch(
            contentSearchResult,
            allResultCount,
            params.query,
            params.startingPage,
            10
        );
        selectedCategoryName = Resource.msg('faq.all.categories', 'faq', null);
    }
    for (var i = 0; i < faqFolder.onlineSubFolders.length; i++) {
        var folderContentSearchModel = new ContentSearchModel();
        folderContentSearchModel.setFolderID(faqFolder.onlineSubFolders[i].ID);
        folderContentSearchModel.setRecursiveFolderSearch(true);
        folderContentSearchModel.setFilteredByFolder(true);
        folderContentSearchModel.setSearchPhrase(params.query);
        folderContentSearchModel.search();
        var count = Number(folderContentSearchModel.getCount());
        if (count > 0) {
            folders.push({
                folderId: faqFolder.onlineSubFolders[i].ID,
                folderName: faqFolder.onlineSubFolders[i].displayName,
                searchResultCount: count
            });
        }
        if (params.categoryId &&
            params.categoryId === faqFolder.onlineSubFolders[i].ID) {
            contentSearchResult = folderContentSearchModel.getContent();
            contentSearch = new ContentSearch(
                contentSearchResult,
                count,
                params.query,
                params.startingPage,
                10
            );
            selectedCategoryId = faqFolder.onlineSubFolders[i].ID;
            selectedCategoryName = faqFolder.onlineSubFolders[i].displayName;
            selectedCategoryResultCount = Number(
                folderContentSearchModel.getCount()
            );
        }
    }
    return {
        searchPhrase: params.query,
        folders: folders,
        contentSearch: contentSearch,
        selectedCategoryResultCount: selectedCategoryResultCount,
        allResultCount: allResultCount,
        selectedCategoryName: selectedCategoryName,
        selectedCategoryId: selectedCategoryId
    };
}

/**
 * Retrieves the Category Landing Page, if available in Page Designer
 * @param {object} categoryID - the category ID as determined from the request
 * @returns {object} a lookup result with these fields:
 *  page - the page that is configured for this category, if any
 *  invisiblePage - the page that is configured for this category if we ignore visibility, if it is different from page
 *  aspectAttributes - the aspect attributes that should be passed to the PageMgr, null if no page was found
 */
function getPageDesignerCategoryPage(categoryID) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var PageMgr = require('dw/experience/PageMgr');
    var HashMap = require('dw/util/HashMap');

    var category = CatalogMgr.getCategory(categoryID.toLowerCase());

    if (category && 'pageDesignerID' in category.custom && category.custom.pageDesignerID) {
        var page = PageMgr.getPage(category.custom.pageDesignerID);
        if (page && page.visible) {
            var aspectAttributes = new HashMap();
            aspectAttributes.category = category;
            return {
                page: page,
                invisiblePage: null,
                aspectAttributes: aspectAttributes
            };
        }
    }
    return base.getPageDesignerCategoryPage(categoryID);
}

/**
 * Set content search configuration values
 * @param {object} params - Provided HTTP query parameters
 * @returns {object} - content search instance
 */
function getContentSearch(params) {
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentSearchModel = require('dw/content/ContentSearchModel');
    var ContentSearch = require('*/cartridge/models/search/faqContentSearch');
    var faqFolder = ContentMgr.getFolder('faq');
    var apiContentSearchModel = new ContentSearchModel();
    apiContentSearchModel.setFolderID(faqFolder.ID);
    apiContentSearchModel.setRecursiveFolderSearch(true);
    apiContentSearchModel.setFilteredByFolder(true);
    apiContentSearchModel.setSearchPhrase(params.query);
    apiContentSearchModel.search();
    var contentSearchResult = apiContentSearchModel.getContent();
    var count = Number(apiContentSearchModel.getCount());
    var contentSearch = new ContentSearch(contentSearchResult, count, params.q, params.startingPage, 6);

    return contentSearch;
}

/**
 * performs a search
 * @param {object} req - Provided HTTP query parameters
 * @param {object} res - Provided HTTP query parameters
 * @returns {object} - an object with relevant search information
 */
function search(req, res) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var URLUtils = require('dw/web/URLUtils');
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');

    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var ProductSearch = require('*/cartridge/models/search/productSearch');

    var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
    var schemaHelper = require('*/cartridge/scripts/helpers/structuredDataHelper');

    var apiProductSearch = new ProductSearchModel();
    var categoryTemplate = '';
    var maxSlots = 4;
    var productSearch;
    var reportingURLs;

    var searchRedirect = req.querystring.q ? apiProductSearch.getSearchRedirect(req.querystring.q) : null;

    if (searchRedirect) {
        return { searchRedirect: searchRedirect.getLocation() };
    }

    apiProductSearch = base.setupSearch(apiProductSearch, req.querystring, req.httpParameterMap);
    apiProductSearch.search();

    if (!apiProductSearch.personalizedSort) {
        base.applyCache(res);
    }
    if (apiProductSearch.getPromotionIDs()) {
        apiProductSearch.getPromotionIDs().remove('oos-products');
    }
    categoryTemplate = base.getCategoryTemplate(apiProductSearch);
    productSearch = new ProductSearch(
        apiProductSearch,
        req.querystring,
        req.querystring.srule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );

    pageMetaHelper.setPageMetaTags(req.pageMetaData, productSearch);

    var canonicalUrl = URLUtils.url('Search-Show', 'cgid', req.querystring.cgid);
    var refineurl = URLUtils.url('Search-Refinebar');
    var allowedParams = ['q', 'cgid', 'pmin', 'pmax', 'srule', 'pmid'];
    var isRefinedSearch = false;

    Object.keys(req.querystring).forEach(function (element) {
        if (allowedParams.indexOf(element) > -1) {
            refineurl.append(element, req.querystring[element]);
        }

        if (['pmin', 'pmax'].indexOf(element) > -1) {
            isRefinedSearch = true;
        }

        if (element === 'preferences') {
            var i = 1;
            isRefinedSearch = true;
            Object.keys(req.querystring[element]).forEach(function (preference) {
                refineurl.append('prefn' + i, preference);
                refineurl.append('prefv' + i, req.querystring[element][preference]);
                i++;
            });
        }
    });

    if (productSearch.searchKeywords !== null && !isRefinedSearch) {
        reportingURLs = reportingUrlsHelper.getProductSearchReportingURLs(productSearch);
    }

    var result = {
        productSearch: productSearch,
        maxSlots: maxSlots,
        reportingURLs: reportingURLs,
        refineurl: refineurl,
        canonicalUrl: canonicalUrl,
        apiProductSearch: apiProductSearch
    };

    if (productSearch.isCategorySearch && !productSearch.isRefinedCategorySearch && categoryTemplate && apiProductSearch.category.parent.ID === 'root') {
        pageMetaHelper.setPageMetaData(req.pageMetaData, productSearch.category);
        result.category = apiProductSearch.category;
        result.categoryTemplate = categoryTemplate;
    }

    if (productSearch.productIds && productSearch.productIds.length && (!categoryTemplate || categoryTemplate === 'rendering/category/categoryproducthits')) {
        result.schemaData = schemaHelper.getListingPageSchema(productSearch.productIds);
    }

    return result;
}

module.exports = {
    setupFaqContentSearch: setupFaqContentSearch,
    getPageDesignerCategoryPage: getPageDesignerCategoryPage,
    getContentSearch: getContentSearch,
    search: search
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
