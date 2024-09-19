'use strict';

/**
 * getPWPPrice
 * @param {any} promotions - promotion applied.
 * @param {any} apiProduct - product object.
 * @returns {any} promo price
 */
function getPWPPrice(promotions, apiProduct) {
    var collections = require('*/cartridge/scripts/util/collections');
    var Money = require('dw/value/Money');
    var formatMoney = require('dw/util/StringUtils').formatMoney;
    var Site = require('dw/system/Site');
    var promoPrice = '';
    collections.forEach(promotions, function (promotion) {
        if ( (promotion.promotionClass === 'PRODUCT' || (promotion.promotionClass === 'ORDER' && promotion.custom.isPWP )) && 'showHppPrice' in promotion.custom && promotion.custom.showHppPrice && 'For' in promotion.custom && promotion.custom.For) {
            if ('ForSelector' in promotion.custom) {
                switch (promotion.custom.ForSelector.value) {
                    case 'Fixed Price':
                        promoPrice = formatMoney(
                            new Money(
                                promotion.custom.For,
                                Site.current.getDefaultCurrency()
                            )
                        );
                        break;
                    case 'Percent Off':
                        promoPrice = formatMoney(
                            new Money(
                                (apiProduct.priceModel.price.value *
                                    (100 - promotion.custom.For)) /
                                    100,
                                Site.current.getDefaultCurrency()
                            )
                        );
                        break;
                    default:
                        break;
                }
            }
            
        }
    });
    return promoPrice === '' ? false : promoPrice;
}

module.exports = function (object, promotions, apiProduct) {
    Object.defineProperty(object, 'pwpPrice', {
        enumerable: true,
        writable: true,
        configurable: true,
        value: getPWPPrice(promotions, apiProduct)
    });
};
