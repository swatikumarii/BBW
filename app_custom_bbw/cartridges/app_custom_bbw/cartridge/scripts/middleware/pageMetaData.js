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

    if (resourceKey === 'search.show' && !req.querystring.cgid) {
        return next();
    }

    var computedMetaData = {
        title: req.pageMetaData.title,
        description: req.pageMetaData.description,
        keywords: req.pageMetaData.keywords,
        pageMetaTags: []
    };

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

    res.setViewData({
        CurrentPageMetaData: computedMetaData
    });
    return next();
}

module.exports = {
    computedPageMetaData: computedPageMetaData
};
