'use strict';

var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');
var preferences = require('*/cartridge/config/preferences');
var ACTION_ENDPOINT = preferences.suggestionsActionEnpoint ? preferences.suggestionsActionEnpoint : 'Product-Show';
var IMAGE_SIZE = preferences.imageSize ? preferences.imageSize : 'medium';
var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');

/**
 * Get Image URL
 * @param {dw.catalog.Product} product - Suggested product
 * @returns {string} - Image URL
 */
function getImageUrl(product) {
    var imageProduct = product;
    if (product.master) {
        imageProduct = product.variationModel.defaultVariant;
    }
    var image = imageProduct.getImage(IMAGE_SIZE);
    return image ? image.URL.toString() : '';
}

/**
 * Compile a list of relevant suggested products
 * @param {dw.util.Iterator.<dw.suggest.SuggestedProduct>} suggestedProducts - Iterator to retrieve
 *                                                                             SuggestedProducts
 *  @param {number} maxItems - Maximum number of products to retrieve
 * @returns {object[]} - Array of suggested products
 */
function getProducts(suggestedProducts, maxItems) {
    var product = null;
    var products = [];

    var collectionSort =
        Site.getCurrent().getCustomPreferenceValue('collectionSort');
    if (collectionSort) {
        var collectionSorts = [];
        collectionSort.split(',').forEach(function (item) {
            collectionSorts.push(item.trim().toUpperCase());
        });
        if (collectionSorts.length > 0) {
            suggestedProducts.sort(function (item1, item2) {
                var collectionName1 = '';
                var index1 = -1;
                var index2 = -1;
                if (
                    item1.productSearchHit.product.custom &&
                    item1.productSearchHit.product.custom.collectionName
                ) {
                    collectionName1 =
                        item1.productSearchHit.product.custom.collectionName.toUpperCase();
                    index1 = collectionSorts.indexOf(collectionName1);
                }
                var collectionName2 = '';
                if (
                    item2.productSearchHit.product.custom &&
                    item2.productSearchHit.product.custom.collectionName
                ) {
                    collectionName2 =
                        item2.productSearchHit.product.custom.collectionName.toUpperCase();
                    index2 = collectionSorts.indexOf(collectionName2);
                }
                if (
                    collectionName1.equals(collectionName2) ||
                    (index1 === -1 && index2 === -1)
                ) {
                    return 0;
                }
                if (index1 === -1) {
                    return 1;
                }
                if (index2 === -1) {
                    return -1;
                }
                if (index1 > index2) {
                    return 1;
                }
                return -1;
            });
        }
    }
    for (var i = 0; i < maxItems && i < suggestedProducts.length; i++) {
        product = suggestedProducts[i].productSearchHit.product;
        products.push({
            id: product.ID,
            name: product.name,
            imageUrl: getImageUrl(product),
            url: URLUtils.url(ACTION_ENDPOINT, 'pid', product.ID)
        });
    }

    return products;
}

/**
 * @typedef SuggestedPhrase
 * @type {object}
 * @property {boolean} exactMatch - Whether suggested phrase is an exact match
 * @property {string} value - Suggested search phrase
 */

/**
 * Compile a list of relevant suggested phrases
 * @param {dw.util.Iterator.<dw.suggest.SuggestedPhrase>} suggestedPhrases - Iterator to retrieve
 *                                                                           SuggestedPhrases
 * @param {number} maxItems - Maximum number of phrases to retrieve
 * @returns {SuggestedPhrase[]} - Array of suggested phrases
 */
function getPhrases(suggestedPhrases, maxItems) {
    var phrase = null;
    var phrases = [];

    for (var i = 0; i < maxItems; i++) {
        if (suggestedPhrases.hasNext()) {
            phrase = suggestedPhrases.next();
            phrases.push({
                exactMatch: phrase.exactMatch,
                value: phrase.phrase
            });
        }
    }

    return phrases;
}

/**
 * @class
 * @classdesc ProductSuggestions class
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {dw.suggest.SuggestModel} suggestions - Suggest Model
 * @param {number} maxItems - Maximum number of items to retrieve
 */
function ProductSuggestions(req, res, suggestions, maxItems) {
    var productSuggestions = suggestions.productSuggestions;

    if (!productSuggestions) {
        this.available = false;
        this.phrases = [];
        this.products = [];
        return;
    }

    var searchPhrasesSuggestions = productSuggestions.searchPhraseSuggestions;

    this.available = productSuggestions.hasSuggestions();
    var phrases = getPhrases(
        searchPhrasesSuggestions.suggestedPhrases,
        maxItems
    );
    this.phrases = phrases;
    var modifiedReq = {
        querystring: req.querystring,
        pageMetaData: req.pageMetaData,
        httpParameterMap: req.httpParameterMap
    };
    modifiedReq.querystring.q = phrases[0].value;
    var result = searchHelper.search(modifiedReq, res);
    this.products = getProducts(result.productSearch.productIds, maxItems);
    this.searchProductCount =
        result && result.productSearch ? result.productSearch.count : 0;
}

module.exports = ProductSuggestions;
