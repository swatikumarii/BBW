'use strict';

var base = module.superModule;
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

/**
 * function : This point will get breadcrumb for a content asset folder
 * @param {object} folder content folder
 * @returns {object} - returns an element of the array that is breadcrumbs.
 */
function getBreadcrumbForContentAssetFolders(folder) {
    if (folder.ID !== 'faq') {// displayName.
        if (folder.parent !== null) {
            var breadcrumbs = getBreadcrumbForContentAssetFolders(folder.parent);
            if (breadcrumbs) {
                breadcrumbs.push({
                    htmlValue: folder.displayName,
                    url: URLUtils.https('Page-Show', 'cid', folder.ID).toString()
                });
                return breadcrumbs;
            }
        } else {
            return [{
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            }];
        }
    }
    return '';
}

/**
 * function : This point will get breadcrumb for a content asset 
 * @param {object} content content assests
 * @returns {object} - returns an element of the array that is breadcrumbs.
 */
function getBreadcrumbForContentAsset(content) {
    var breadcrumbs = [];
    if (content.folders && content.folders.length > 0) {
        breadcrumbs = getBreadcrumbForContentAssetFolders(content.folders[0]);
    } else {
        breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            }
        ];
    }
    if (breadcrumbs) {
        breadcrumbs.push({
            htmlValue: content.name,
            url: URLUtils.https('Page-Show', 'cid', content.ID).toString()
        });
        return breadcrumbs;
    }
    return '';
}

module.exports = {
    getBreadcrumbForContentAsset: getBreadcrumbForContentAsset
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
