/**
 * @File Name          : isGreetingCard.js
 * @Description        : isGreetingCard.js file for product to check if is Greeting Card
 * Ver       Modification
 * 1.0    Custom  gift wrap check
 */

'use strict';

var site = require('dw/system/Site');
var collections = require('*/cartridge/scripts/util/collections');

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'isGreetingCardCategory', {
        enumerable: true,
        value: (function () {
            var isGreetingCardCategory = false;
            if (apiProduct && apiProduct.categories.length > 0) {
                var categoryName = site.current.getCustomPreferenceValue(
                    'greetingCardCategoryName'
                );
                collections.forEach(apiProduct.categories, function (category) {
                    if (category.ID === categoryName) {
                        isGreetingCardCategory = true;
                    }
                });
            }
            return isGreetingCardCategory;
        })()
    });
};
