/**
 * File Name          : isGiftWrapCategory.js
 * Description        : isGiftWrapCategory.js file for product to check if is Gift Wrap product category
 * Ver       Modification
 * 1.0    Custom gift wrap category product check
 */

'use strict';

var site = require('dw/system/Site');
var commonHelpers = require('*/cartridge/models/scripts/util/commonHelpers');

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'isGiftWrapCategory', {
        enumerable: true,
        value: commonHelpers.isCategoryMatches(
            apiProduct,
            site.current.getCustomPreferenceValue('giftWrapCategoryName')
        )
    });
};
