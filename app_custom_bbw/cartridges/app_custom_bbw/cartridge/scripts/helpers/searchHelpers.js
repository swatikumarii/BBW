'use strict';

var base = module.superModule;

/**
 * Set content search configuration values
 * @param {object} params - Provided HTTP query parameters
 * @returns {object} - content search instance
 */
function setupFaqContentSearch(params) {
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
    var count = Number(apiContentSearchModel.getCount());
    var contentSearch = null;
    var contentSearchResult = null;
    if (!params.categoryId) {
        contentSearchResult = apiContentSearchModel.getContent();
        contentSearch = new ContentSearch(
            contentSearchResult,
            count,
            params.query,
            params.startingPage,
            null
        );
    }
    for (var i = 0; i < faqFolder.onlineSubFolders.length; i++) {
        var folderContentSearchModel = new ContentSearchModel();
        folderContentSearchModel.setFolderID(faqFolder.onlineSubFolders[i].ID);
        folderContentSearchModel.setRecursiveFolderSearch(true);
        folderContentSearchModel.setFilteredByFolder(true);
        folderContentSearchModel.setSearchPhrase(params.query);
        folderContentSearchModel.search();
        count = Number(folderContentSearchModel.getCount());
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
                null
            );
            count = Number(folderContentSearchModel.getCount());
        }
    }
    return {
        searchPhrase: params.query,
        count: count,
        folders: folders,
        contentSearch: contentSearch
    };
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
