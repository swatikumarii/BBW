/**
 * File Name          : isGreetingCard.js
 * Description        : isGreetingCard.js file for product to check if is Greeting Card
 * Ver       Modification
 * 1.0    Custom  gift wrap check
 */

'use strict';

var site = require('dw/system/Site');
var commonHelpers = require('*/cartridge/models/scripts/util/commonHelpers');

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'isGreetingCardCategory', {
        enumerable: true,
        value: commonHelpers.isCategoryMatches(
            apiProduct,
            site.current.getCustomPreferenceValue('greetingCardCategoryName')
        )
    });
};
