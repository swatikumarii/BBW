'use strict';

/**
 * getPromotionPrice
 * @param {any} promotions - promotion applied.
 * @returns {any} promo price
 */
function getPromotionPrice(promotions) {
    var collections = require('*/cartridge/scripts/util/collections');
    var Money = require('dw/value/Money');
    var formatMoney = require('dw/util/StringUtils').formatMoney;
    var Site = require('dw/system/Site');
    var promoPrice = '';
    collections.forEach(promotions, function (promotion) {
        if (
            promotion.promotionClass === 'PRODUCT' &&
            'showHppPrice' in promotion.custom &&
            promotion.custom.showHppPrice &&
            'For' in promotion.custom &&
            promotion.custom.For
        ) {
            promoPrice = formatMoney(
                new Money(
                    promotion.custom.For,
                    Site.current.getDefaultCurrency()
                )
            );
        }
    });
    return promoPrice === '' ? false : promoPrice;
}

module.exports = function (object, promotions) {
    Object.defineProperty(object, 'promoPrice', {
        enumerable: true,
        writable: true,
        configurable: true,
        value: getPromotionPrice(promotions)
    });
};
