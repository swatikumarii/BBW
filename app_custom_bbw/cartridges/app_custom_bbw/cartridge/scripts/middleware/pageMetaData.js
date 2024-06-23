'use strict';

/**
 * Middleware to compute request pageMetaData object
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function computedPageMetaData(req, res, next) {
    var resourceKey = 'default.start';
    if (req.session.raw.clickStream.enabled) {
        var lastClickStream = req.session.clickStream.last;
        if (lastClickStream && lastClickStream.pipelineName) {
            resourceKey = lastClickStream.pipelineName.replace('-', '.').toLowerCase();
        }
    } else {
        var pathParts = req.path.split('/');
        resourceKey = pathParts[pathParts.length - 1].replace('-', '.').toLowerCase();
    }

    var computedMetaData = {
        title: req.pageMetaData.title,
        description: req.pageMetaData.description,
        keywords: req.pageMetaData.keywords,
        pageMetaTags: []
    };

    if (resourceKey === 'search.show' && !req.querystring.cgid) {
        var ContentMgr = require('dw/content/ContentMgr');
        var contentAsset = ContentMgr.getContent(resourceKey + '.seo');
        // As the content asset is mainly used for SEO purpose, no need to put it online
        if (!empty(contentAsset)) {
            computedMetaData.title = contentAsset.getPageTitle();
            computedMetaData.description = contentAsset.getPageDescription();
            computedMetaData.keywords = contentAsset.getPageKeywords();
            computedMetaData.pageMetaTags = contentAsset.getPageMetaTags();
        }
    } else {
        req.pageMetaData.pageMetaTags.forEach(function (item) {
            if (item.title) {
                computedMetaData.title = item.content;
            } else if (item.name && item.ID === 'description') {
                computedMetaData.description = item.content;
            } else if (item.name && item.ID === 'keywords') {
                computedMetaData.keywords = item.content;
            } else {
                computedMetaData.pageMetaTags.push(item);
            }
        });
    }


    res.setViewData({
        CurrentPageMetaData: computedMetaData
    });
    return next();
}

module.exports = {
    computedPageMetaData: computedPageMetaData
};
