'use strict';

var base = module.superModule;

var ContentMgr = require('dw/content/ContentMgr');
var Resource = require('dw/web/Resource');

/**
 * Add the page meta data for the current controller to the request page meta data
 * @param {object} req The request wrapper
 * @param {object} res The response wrapper
 * @param {Function} next The next function to execute
 * @returns {void}
 */
function addCurrentPageMetaData(req, res, next) {
    if (!require('*/cartridge/config/seoPreferences').enablePageMetaData) {
        return next();
    }

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

    var title = Resource.msg(resourceKey + '.title', 'seo', null);
    var description = Resource.msg(resourceKey + '.description', 'seo', null);
    var keywords = Resource.msg(resourceKey + '.keywords', 'seo', null);
    var pageMetaTags;

    var contentAsset = ContentMgr.getContent(resourceKey + '.seo');
    // As the content asset is mainly used for SEO purpose, no need to put it online
    if (!empty(contentAsset)) {
        title = contentAsset.getPageTitle();
        description = contentAsset.getPageDescription();
        keywords = contentAsset.getPageKeywords();
        pageMetaTags = contentAsset.getPageMetaTags();
    }

    require('*/cartridge/scripts/helpers/seoHelper').setPageMetaData(req, {
        key: resourceKey,
        title: title,
        description: description,
        keywords: keywords,
        pageMetaTags: pageMetaTags
    });


    if (!res.getViewData().canonicalUrl) {
        var seoHelper = require('*/cartridge/scripts/helpers/seoHelper');
        res.setViewData({
            canonicalUrl: seoHelper.getCanonicalUrl(
                req.path.substring(req.path.lastIndexOf('/') + 1)
            )
        });
    }

    return next();
}

base.addCurrentPageMetaData = addCurrentPageMetaData;

module.exports = base;
