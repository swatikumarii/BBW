/**
 * File Name          : isGreetingCard.js
 * Description        : isGreetingCard.js file for product to check if is Greeting Card
 * Ver       Modification
 * 1.0    Custom  gift wrap check
 */

'use strict';

var site = require('dw/system/Site');
var productHelpers = require('*/cartridge/scripts/helpers/product');
var customPreferenceNames = require('*/cartridge/config/customPreferenceNames');

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'isGreetingCardCategory', {
        enumerable: true,
        value: productHelpers.isCategoryMatches(
            apiProduct,
            site.current.getCustomPreferenceValue(customPreferenceNames.greetingCardCategoryName)
        )
    });
};
