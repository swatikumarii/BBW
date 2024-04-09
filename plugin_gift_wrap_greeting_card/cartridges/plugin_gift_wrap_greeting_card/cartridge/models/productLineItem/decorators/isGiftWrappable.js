/**
 * File Name          : giftwrap.js
 * Description        : giftwrap.js file for product to check if is wrappable as gift
 * Ver       Modification
 * 1.0    Custom  gift wrap check
 */

'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'isGiftWrappable', {
        enumerable: true,
        value:
            apiProduct && apiProduct.custom.isGiftWrappable
                ? apiProduct.custom.isGiftWrappable
                : false
    });
};
