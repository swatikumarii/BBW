'use strict';

var formatMoney = require('dw/util/StringUtils').formatMoney;
var Money = require('dw/value/Money');

/**
 *
 * @param {object} lineItem apilineItem
 * @returns {object} promo price
 */
function getPromoPrice(lineItem) {
    if (lineItem.adjustedGrossPrice.value !== lineItem.grossPrice.value) {
        if (lineItem.adjustedGrossPrice.value === 0) {
            return 'Free';
        }
        var promoPrice = lineItem.adjustedGrossPrice.value / lineItem.quantityValue;
        return formatMoney(
            new Money(promoPrice, lineItem.adjustedGrossPrice.currencyCode)
        );

    }
    return false;
}

module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'promoPrice', {
        enumerable: true,
        value: getPromoPrice(lineItem)
    });
};
