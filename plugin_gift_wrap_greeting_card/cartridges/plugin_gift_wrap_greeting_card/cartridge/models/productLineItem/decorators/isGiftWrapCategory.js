/**
 * File Name          : isGiftWrapCategory.js
 * Description        : isGiftWrapCategory.js file for product to check if is Gift Wrap product category
 * Ver       Modification
 * 1.0    Custom gift wrap category product check
 */

'use strict';

var site = require('dw/system/Site');
var productHelpers = require('*/cartridge/scripts/helpers/product');
var customPreferenceNames = require('*/cartridge/config/customPreferenceNames');

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'isGiftWrapCategory', {
        enumerable: true,
        value: productHelpers.isCategoryMatches(
            apiProduct,
            site.current.getCustomPreferenceValue(customPreferenceNames.giftWrapCategoryName)
        )
    });
};
