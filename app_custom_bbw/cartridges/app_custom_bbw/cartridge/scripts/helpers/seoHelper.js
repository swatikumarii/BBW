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
 * @param {string} locale - Locale ID
 * @param {object} currentSite - Current Site default
 * @param {object} urlParameters - Url parameters (pipeline, querystring)
 * @returns {string} the hreflang key
 */
function getHreflang(isDefault, locale, currentSite, urlParameters) {
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
            : locale.ID.split('_').reverse().join('-').toLowerCase()
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
                    getHreflang(false, locale.ID, currentSite, urlParameters)
                );
            }
            return acc;
        },
        [
            getHreflang(
                true,
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

base.renderHreflang = renderHreflang;

module.exports = base;
