'use strict';

var Money = require('dw/value/Money');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var Site = require('dw/system/Site');

/**
 *
 * @param {object} lineItem apilineItem
 * @returns {Money} totalSavings
 */
function getTotalSavings(lineItem) {
    var totalSavings = new Money(0, Site.current.getDefaultCurrency());
    if (lineItem.priceAdjustments.length) {
        for (var index = 0; index < lineItem.priceAdjustments.length; index++) {
            var priceAdjustment = lineItem.priceAdjustments[index];
            if (
                (priceAdjustment.appliedDiscount && priceAdjustment.appliedDiscount
                    .type === 'FREE') ||
                (priceAdjustment.promotion && priceAdjustment.promotion.promotionClass === 'PRODUCT')
            ) {
                totalSavings = totalSavings.add(
                    new Money(
                        priceAdjustment.basePrice * -1,
                        Site.current.getDefaultCurrency()
                    )
                );
            }
        }
        return totalSavings.value !== 0 ? formatMoney(totalSavings) : '-';
    }
    return '-';
    
}

module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'totalSavings', {
        enumerable: true,
        value: getTotalSavings(lineItem)
    });
};
