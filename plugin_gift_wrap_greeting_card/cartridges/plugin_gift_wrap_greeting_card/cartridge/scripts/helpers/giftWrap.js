/**
 * File Name          : giftWrap.js
 * Description        : giftWrapHelpers
 * Ver          Modification
 * 1.0          Common functions
 */

'use strict';

var collections = require('*/cartridge/scripts/util/collections');

/**
 *
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems : Product line items
 * @returns {number} : Count of wrappable items from Product line items
 */
function getWrappableProductCount(productLineItems) {
    var count = 0;
    collections.forEach(productLineItems, function(productLineItem) {
        if (productLineItem.product.custom.isGiftWrappable) {
            count++;
        }
    });
    return count;
}

/**
 *
 * @param {Array} wrappableProducts - Wrappable products
 * @param {number} wrappedProductCount - Wrapped product count
 * @param {Array} wrappedProductQuantity - Wrapped quantity array
 * @returns {string} : Return wrap type
 */
function getWrapType(
    wrappableProducts,
    wrappedProductCount,
    wrappedProductQuantity
) {
    var wrapType = '';
    if (wrappedProductCount > 0) {
        if (wrappedProductCount === 1) {
            if (
                wrappedProductQuantity[0] === 0 ||
                wrappableProducts[0].quantity === 1
            ) {
                wrapType = 'wrapTogether';
            } else {
                wrapType = 'wrapIndividually';
            }
        } else if (wrappedProductQuantity[0] === 0) {
            wrapType = 'wrapTogether';
        } else {
            wrapType = 'wrapIndividually';
        }
    }
    return wrapType;
}

module.exports = {
    getWrapType: getWrapType,
    getWrappableProductCount: getWrappableProductCount
};
