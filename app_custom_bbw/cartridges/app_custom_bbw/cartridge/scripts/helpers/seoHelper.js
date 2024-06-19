'use strict';

var base = module.superModule;

var Logger = require('dw/system/Logger');
var Locale = require('dw/util/Locale');
var Site = require('dw/system/Site');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Get hreflang key
 * @param {boolean} isDefault - default url or not
 * @param {boolean} isHomePage - is home page url or not
 * @param {string} locale - Locale ID
 * @param {object} currentSite - Current Site default
 * @param {object} urlParameters - Url parameters (pipeline, querystring)
 * @returns {string} the hreflang key
 */
function getHreflang(
    isDefault,
    isHomePage,
    locale,
    currentSite,
    urlParameters
) {
    if (isHomePage) {
        return {
            url: 'https://' + request.httpHost,
            hreflang: isDefault
                ? 'x-default'
                : locale.split('_').reverse().join('-').toLowerCase()
        };
    }
    var link = base.getLink(urlParameters, currentSite.ID, locale);
    return {
        url:
            link +
            urlParameters.queryString.replace(
                base.EXCLUDED_PARAMS_REGEX,
                function (match) {
                    return match.indexOf('?') > -1 && match.indexOf('&') > -1
                        ? '?'
                        : '';
                }
            ),
        hreflang: isDefault
            ? 'x-default'
            : locale.split('_').reverse().join('-').toLowerCase()
    };
}

/**
 * Return list of hreflangs
 * @param {dw.system.PipelineDictionary} pdict - Pipeline Dictionary
 * @returns {object} List of hreflangs
 */
function getHreflangs(pdict) {
    var countries = require('*/cartridge/config/countries');

    var urlParameters = base.getUrlParameters(pdict);
    var currentSite = Site.getCurrent();

    return countries.reduce(
        function (acc, country) {
            var locale = Locale.getLocale(country.id);
            if (
                !empty(locale) &&
                currentSite.allowedLocales.indexOf(locale.ID) > -1
            ) {
                acc.push(
                    getHreflang(
                        false,
                        pdict.isHomePage,
                        locale.ID,
                        currentSite,
                        urlParameters
                    )
                );
            }
            return acc;
        },
        [
            getHreflang(
                true,
                pdict.isHomePage,
                currentSite.defaultLocale,
                currentSite,
                urlParameters
            )
        ]
    );
}

/**
 * Renders hreflang
 * @param {dw.system.PipelineDictionary} pdict - Pipeline Dictionary
 * @returns {string} hreflang content
 */
function renderHreflang(pdict) {
    var hreflangs = getHreflangs(pdict);
    var model = new HashMap();
    model.put('hreflangs', hreflangs);
    try {
        return new Template('/seo/hreflang').render(model).text;
    } catch (e) {
        Logger.error('Error while rendering template seo/hreflang : ' + e.message);
        return '';
    }
}

/**
 * Returns custom Open Graph Meta Tags (such as image)
 * @param {dw.system.PipelineDictionary} pdict - Pipeline Dictionary
 * @returns {object} Open Graph Meta Tags
 */
function getOpenGraphMetaTags(pdict) {
    var URLUtils = require('dw/web/URLUtils');
    var pageMetaTags = pdict.CurrentPageMetaData.pageMetaTags || [];
    var ogMetaTags = [
        { ID: 'og:type', content: 'website' },
        { ID: 'og:title', content: pdict.CurrentPageMetaData.title },
        { ID: 'og:locale', content: request.getLocale() },
        { ID: 'twitter:card', content: 'summary_large_image' }
    ];
    if (!empty(pdict.CurrentPageMetaData.description)) {
        ogMetaTags.push({
            ID: 'og:description',
            content: pdict.CurrentPageMetaData.description
        });
    }
    if (
        pdict.product &&
        pdict.product.images &&
        pdict.product.images.mediumLarge &&
        pdict.product.images.mediumLarge[0]
    ) {
        ogMetaTags.push({
            ID: 'image',
            content: pdict.product.images.mediumLarge[0].absURL
        });
        ogMetaTags.push({
            ID: 'og:image',
            content: pdict.product.images.mediumLarge[0].absURL
        });
    } else if (
        pdict.apiProductSearch &&
        pdict.apiProductSearch.category &&
        pdict.apiProductSearch.category.thumbnail &&
        pdict.apiProductSearch.category.thumbnail.absURL
    ) {
        ogMetaTags.push({
            ID: 'og:image',
            content: pdict.apiProductSearch.category.thumbnail.absURL
        });
    } else if (
        pdict.image
    ) {
        ogMetaTags.push({
            ID: 'og:image',
            content: pdict.image
        });
    } else {
        ogMetaTags.push({
            ID: 'og:image',
            content: URLUtils.staticURL('/images/bbw-logo.png')
        });
    }
    if (pdict.canonicalUrl) {
        ogMetaTags.push({ ID: 'og:url', content: pdict.canonicalUrl });
    }
    return ogMetaTags.filter(function (ogMeta) {
        return !base.metaExists(ogMeta.ID, pageMetaTags);
    });
}

/**
 * Renders Open Graph Meta Tags
 * @param {dw.system.PipelineDictionary} pdict - Pipeline Dictionary
 * @returns {string} open graph content
 */
function renderOpenGraphMetaTags(pdict) {
    var ogTags = getOpenGraphMetaTags(pdict);
    var model = new HashMap();
    model.put('ogTags', ogTags);
    try {
        return new Template('/seo/openGraphMetaTags').render(model).text;
    } catch (e) {
        Logger.error('Error while rendering template seo/openGraphMetaTags : ' + e.message);
        return '';
    }
}


/**
 * Set the page meta data to the current request
 * @param {object} req The request object
 * @param {object} metaDataObj The object that contains all the metadata
 */
function setPageMetaData(req, metaDataObj) {
    // Extension point that allows other catridges to change the values
    var HookMgr = require('dw/system/HookMgr');
    if (HookMgr.hasHook('app.seo.setpagemetadata')) {
        var result = HookMgr.callHook('app.seo.setpagemetadata', metaDataObj.key.replace('.', '_'), metaDataObj);
        if (!empty(result)) {
            metaDataObj.title = result.title || metaDataObj.title;// eslint-disable-line
            metaDataObj.description = result.description || metaDataObj.description;// eslint-disable-line
            metaDataObj.keywords = result.keywords || metaDataObj.keywords;// eslint-disable-line
            metaDataObj.pageMetaTags = result.pageMetaTags || metaDataObj.pageMetaTags;// eslint-disable-line
        }
    }

    if (metaDataObj.title) {
        req.pageMetaData.setTitle(
            metaDataObj.title.indexOf(Site.getCurrent().getName()) === -1
                ? metaDataObj.title + ' | ' + Site.getCurrent().getName()
                : metaDataObj.title
        );
    }

    if (metaDataObj.description) {
        req.pageMetaData.setDescription(metaDataObj.description);
    }

    if (metaDataObj.keywords) {
        req.pageMetaData.setKeywords(metaDataObj.keywords);
    }

    if (metaDataObj.pageMetaTags) {
        req.pageMetaData.addPageMetaTags(metaDataObj.pageMetaTags);
    }
}

base.renderHreflang = renderHreflang;
base.renderOpenGraphMetaTags = renderOpenGraphMetaTags;
base.setPageMetaData = setPageMetaData;

module.exports = base;
