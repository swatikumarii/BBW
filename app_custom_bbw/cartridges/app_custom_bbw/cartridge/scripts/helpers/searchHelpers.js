'use strict';

var base = module.superModule;

/**
 * Set content search configuration values
 * @param {object} params - Provided HTTP query parameters
 * @returns {object} - content search instance
 */
function setupFaqContentSearch(params) {
    var ContentSearchModel = require('dw/content/ContentSearchModel');
    var ContentSearch = require('*/cartridge/models/search/contentSearch');
    var apiContentSearchModel = new ContentSearchModel();

    apiContentSearchModel.setFolderID('faq');
    apiContentSearchModel.setRecursiveFolderSearch(true);
    apiContentSearchModel.setFilteredByFolder(true);
    apiContentSearchModel.setSearchPhrase(params.q);
    apiContentSearchModel.search();
    var contentSearchResult = apiContentSearchModel.getContent();
    var count = Number(apiContentSearchModel.getCount());
    var contentSearch = new ContentSearch(contentSearchResult, count, params.q, params.startingPage, null);
    
    // collection(apiContentSearchModel.refinements.matchingFolders, function (folder) {
    //     folder.parent.ID
    // });

    return contentSearch;
}

module.exports = {
    setupFaqContentSearch: setupFaqContentSearch
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
