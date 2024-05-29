'use strict';

/**
 *
 * @param {object} lineItem apilineItem
 * @returns {number} totalSavings totalSavings
 */
function getTotalSavings(lineItem) {
    var totalSavings = 0;
    if (lineItem.priceAdjustments.length) {
        for (var index = 0; index < lineItem.priceAdjustments.length; index++) {
            var priceAdjustment = lineItem.priceAdjustments[index];
            if (priceAdjustment.appliedDiscount.type === 'FREE') {
                totalSavings += (priceAdjustment.basePrice * -1);
            }
        }
    }
    return totalSavings;
}

module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'totalSavings', {
        enumerable: true,
        value: getTotalSavings(lineItem)
    });
};
