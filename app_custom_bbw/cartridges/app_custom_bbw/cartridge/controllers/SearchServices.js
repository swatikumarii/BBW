'use strict';

/**
 * @namespace SearchServices
 */

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');

var Resource = require('dw/web/Resource');

/**
 * SearchServices-GetSuggestions : The SearchServices-GetSuggestions endpoint is responsible for searching as you type and displaying the suggestions from that search
 * @name SearchServices-GetSuggestions
 */
server.replace('GetSuggestions', cache.applyDefaultCache, function (req, res, next) {
    var SuggestModel = require('dw/suggest/SuggestModel');
    var CategorySuggestions = require('*/cartridge/models/search/suggestions/category');
    var ContentSuggestions = require('*/cartridge/models/search/suggestions/content');
    var ProductSuggestions = require('*/cartridge/models/search/suggestions/product');
    var SearchPhraseSuggestions = require('*/cartridge/models/search/suggestions/searchPhrase');
    var categorySuggestions;
    var contentSuggestions;
    var productSuggestions;
    var recentSuggestions;
    var popularSuggestions;
    var brandSuggestions;
    var searchTerms = req.querystring.q;
    var suggestions;
    // TODO: Move minChars and maxSuggestions to Site Preferences when ready for refactoring
    var minChars = 3;
    // Unfortunately, by default, max suggestions is set to 10 and is not configurable in Business
    // Manager.
    var maxSuggestions = 10;
    suggestions = new SuggestModel();
    suggestions.setFilteredByFolder(false);
    suggestions.setSearchPhrase(searchTerms);
    suggestions.setMaxSuggestions(maxSuggestions);

    recentSuggestions = new SearchPhraseSuggestions(suggestions.recentSearchPhrases, maxSuggestions);
    popularSuggestions = new SearchPhraseSuggestions(suggestions.popularSearchPhrases, maxSuggestions);
    brandSuggestions = new SearchPhraseSuggestions(suggestions.brandSuggestions, maxSuggestions);

    var total =
        recentSuggestions.phrases.length +
        popularSuggestions.phrases.length +
        brandSuggestions.phrases.length;
    if (searchTerms && searchTerms.length >= minChars) {
        categorySuggestions = new CategorySuggestions(suggestions, maxSuggestions);
        contentSuggestions = new ContentSuggestions(suggestions, maxSuggestions);
        productSuggestions = new ProductSuggestions(suggestions, maxSuggestions);

        if (productSuggestions.available || contentSuggestions.available
            || categorySuggestions.available
            || recentSuggestions.available
            || popularSuggestions.available
            || brandSuggestions.available) {
            total += productSuggestions.products.length + contentSuggestions.contents.length
                + categorySuggestions.categories.length;
            res.render('search/suggestions', {
                suggestions: {
                    product: productSuggestions,
                    category: categorySuggestions,
                    content: contentSuggestions,
                    recent: recentSuggestions,
                    popular: popularSuggestions,
                    brand: brandSuggestions,
                    message: Resource.msgf('label.header.search.result.count.msg', 'common', null, ['' + total])
                }
            });
        } else {
            res.render('search/suggestions', {
                suggestions: {
                    message: Resource.msgf(
                        'label.header.search.result.count.msg',
                        'common',
                        null,
                        ['' + 0]
                    )
                }
            });
        }
    } else if (
        recentSuggestions.available ||
            popularSuggestions.available ||
            brandSuggestions.available
    ) {
        res.render('search/suggestions', {
            suggestions: {
                recent: recentSuggestions,
                popular: popularSuggestions,
                brand: brandSuggestions,
                message: Resource.msgf(
                    'label.header.search.result.count.msg',
                    'common',
                    null,
                    ['' + total]
                )
            }
        });
    } else {
        res.render('search/suggestions', {
            suggestions: {
                message: Resource.msgf(
                    'label.header.search.result.count.msg',
                    'common',
                    null,
                    ['' + 0]
                )
            }
        });
    }

    next();
});

module.exports = server.exports();
