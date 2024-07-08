'use strict';

var URLUtils = require('dw/web/URLUtils');
var ACTION_ENDPOINT = 'Search-Show';
var Logger = require('dw/system/Logger');

/**
 * Compile a list of relevant suggested phrases
 * @param {dw.util.Iterator.<dw.suggest.SuggestedPhrase>} suggestedPhrases - Iterator to retrieve
 *                                                                           SuggestedPhrases
 * @param {number} maxItems - Maximum number of phrases to retrieve
 * @returns {object[]} - Array of suggested phrases
 */
function getPhrases(suggestedPhrases, maxItems) {
    var phrases = [];
    try {
        for (var i = 0; i < maxItems; i++) {
            var phrase = null;
            if (suggestedPhrases.hasNext()) {
                phrase = suggestedPhrases.next();
                phrases.push({
                    value: phrase.phrase,
                    url: URLUtils.url(ACTION_ENDPOINT, 'q', phrase.phrase)
                });
            }
        }
    } catch (error) {
        Logger.error(
            'Exception occoured while executing getPhrases function: {0}' +
                error.message
        );
    }

    return phrases;
}

/**
 * @param {dw.suggest.SuggestModel} suggestions - Suggest Model
 * @param {number} maxItems - Maximum number of categories to retrieve
 */
function SearchPhraseSuggestions(suggestions, maxItems) {
    var suggestedPhrases = suggestions;

    if (!suggestions) {
        this.available = false;
        return;
    }

    if ('searchPhraseSuggestions' in suggestions) {
        this.available = suggestions.searchPhraseSuggestions.hasSuggestedPhrases();
        suggestedPhrases = suggestions.searchPhraseSuggestions.suggestedPhrases;
    } else {
        this.available = suggestions.hasNext();
    }

    this.phrases = getPhrases(suggestedPhrases, maxItems);
}

module.exports = SearchPhraseSuggestions;
