'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var Money = require('dw/value/Money');
var BasketMgr = require('dw/order/BasketMgr');
var currentBasket;
try {
    currentBasket = BasketMgr.getCurrentBasket();
} catch (error) {
    currentBasket = false;
}

/**
 * toFixedIfNecessary
 * @param {number} value - to be formatted
 * @returns {number} updated value
 */
function toFixedIfNecessary(value){
    return +value.toFixed(2);
}


/**
 *
 * @param {Array} buy - Buy Qty Array
 * @param {number} inCart - No of items in cart
 * @returns {number} index after decrement
 */
function applicableIndex(buy, inCart) {
    for (var i = 0; i < buy.length - 1; i++) {
        if (buy[i] <= inCart && buy[i + 1] > inCart) {
            return i+1;
        }
    }
    return 0;
}

/**
 *
 * @param {object} promotion - promotion to check
 * @returns {string} motivator message
 */
function checkMotivator(promotion) {
    var qualifyingValueInCart = 0;
    var buy = promotion.custom && 'Buy' in promotion.custom && promotion.custom.Buy ? promotion.custom.Buy : false;
    var get = promotion.custom && 'Get' in promotion.custom && promotion.custom.Get ? promotion.custom.Get : false;
    var discountType = promotion.custom && 'ForSelector' in promotion.custom && promotion.custom.ForSelector ? promotion.custom.ForSelector.value : false;
    var promotionCondition = promotion.custom && 'promotionCondition' in promotion.custom && promotion.custom.promotionCondition ? promotion.custom.promotionCondition.value : false;
    var qualifyingProducts = promotion.custom && 'qualifyingProducts' in promotion.custom && promotion.custom.qualifyingProducts ? promotion.custom.qualifyingProducts.split(',') : false;
    var discountedProducts = promotion.custom && 'discountedProducts' in promotion.custom && promotion.custom.discountedProducts ? promotion.custom.discountedProducts.split(',') : false;
    var qualificationMessage = promotion.custom && 'qualificationMessage' in promotion.custom && promotion.custom.qualificationMessage ? promotion.custom.qualificationMessage.source : false;
    var addFreeMessage = promotion.custom && 'addFreeMessage' in promotion.custom && promotion.custom.addFreeMessage ? promotion.custom.addFreeMessage.source : false;
    var message;
    if (!discountedProducts && qualifyingProducts) {
        discountedProducts = qualifyingProducts;
    }

    if (!addFreeMessage) {
        addFreeMessage = qualificationMessage;
    }

    if (!(buy && get && discountType && promotionCondition && qualifyingProducts && discountedProducts && qualificationMessage && addFreeMessage)) {
        return false;
    }
    var indexToApply = buy.length - 1;
    switch (promotionCondition) {
        case 'Amount':
            collections.forEach(currentBasket.allProductLineItems, function (item) {
                if (qualifyingProducts.includes(item.productID)) {
                    qualifyingValueInCart += item.adjustedGrossPrice.value;
                }
            });
            if (buy[indexToApply] <= qualifyingValueInCart) {
                return false;
            }
            if (qualifyingValueInCart === 0) {
                return false;
            }
            message = qualificationMessage.replace('{{Buy}}', formatMoney(new Money(toFixedIfNecessary(buy[indexToApply] - qualifyingValueInCart), currentBasket.currencyCode))).replace('{{Get}}', get[indexToApply]);
            return message;

        case 'Number':
            collections.forEach(currentBasket.allProductLineItems, function (item) {
                if (qualifyingProducts.includes(item.productID)) {
                    qualifyingValueInCart += item.quantityValue;
                }
            });
            var getValue;
            if (discountType === 'Free') {
                if (qualifyingValueInCart < (buy[indexToApply] + get[indexToApply]) && ((buy[indexToApply] + get[indexToApply]) - qualifyingValueInCart) >= (buy[indexToApply - 1] + get[indexToApply - 1])) {
                    indexToApply--;
                } else {
                    while ((buy[indexToApply] + get[indexToApply]) <= qualifyingValueInCart) {
                        qualifyingValueInCart -= (buy[indexToApply] + get[indexToApply]);
                    }
                    if (qualifyingValueInCart < (buy[indexToApply] + get[indexToApply]) && ((buy[indexToApply] + get[indexToApply]) - qualifyingValueInCart) >= (buy[indexToApply - 1] + get[indexToApply - 1])) {
                        indexToApply--;
                    }
                }

                getValue = get[indexToApply];

                if (indexToApply > 0) {
                    qualifyingValueInCart -= get[indexToApply -1 ];
                    getValue -= get[indexToApply -1 ];
                }

                if (qualifyingValueInCart === 0) {
                    return false;
                }
                if (qualifyingValueInCart === buy[indexToApply]) {
                    message = addFreeMessage.replace('{{Get}}', getValue);
                    return message;
                }
                if (qualifyingValueInCart > buy[indexToApply]) {
                    message = addFreeMessage.replace('{{Get}}', toFixedIfNecessary(getValue - (qualifyingValueInCart - buy[indexToApply])));
                    return message;
                }
                message = qualificationMessage.replace('{{Buy}}', toFixedIfNecessary(buy[indexToApply] - qualifyingValueInCart)).replace('{{Get}}', getValue);
                return message;
            }

            if (discountType === 'Fixed Price') {
                var showFullPricedMsg = true;
                var buyTotal = 0;
                var actualqualifyingValueInCart = qualifyingValueInCart;
                buy.forEach(function (buyQty) {
                    buyTotal += buyQty;
                    if (qualifyingValueInCart === buyTotal || (qualifyingValueInCart > buyTotal && (qualifyingValueInCart % buyTotal) ===0)) {
                        showFullPricedMsg = false;
                    }
                });
                if (qualifyingValueInCart < buy[indexToApply]) {
                    indexToApply = applicableIndex(buy, qualifyingValueInCart);
                } else {
                    while (buy[indexToApply]  <= qualifyingValueInCart) {
                        qualifyingValueInCart -= buy[indexToApply];
                    }
                    if (qualifyingValueInCart < buy[indexToApply] && (buy[indexToApply] - qualifyingValueInCart) >= buy[indexToApply - 1]) {
                        indexToApply = applicableIndex(buy, qualifyingValueInCart);
                    }
                }

                if (qualifyingValueInCart === 0) {
                    return false;
                }

                if ((buy[indexToApply] - qualifyingValueInCart) === 0) {
                    indexToApply++;
                }

                message = qualificationMessage.replace('{{Buy}}', toFixedIfNecessary(buy[indexToApply] - qualifyingValueInCart)).replace('{{Get}}', get[indexToApply]);
                if (showFullPricedMsg && (indexToApply !== 0 || actualqualifyingValueInCart > buy[0])) {
                    message += '<span class="h-clr--red h-font-size--12 d-none">There are some full priced items</span>';
                }
                return message;

            }

            if (buy[indexToApply] <= qualifyingValueInCart) {
                return false;
            }
            if (qualifyingValueInCart === 0) {
                return false;
            }

            message = qualificationMessage.replace('{{Buy}}', toFixedIfNecessary(buy[indexToApply] - qualifyingValueInCart)).replace('{{Get}}', get[indexToApply]);
            return message;

        default:
            return false;
    }
}

module.exports = function (object, promotions) {
    Object.defineProperty(object, 'promotions', {
        enumerable: true,
        writable: true,
        value: promotions.length === 0 ? null : collections.map(promotions, function (promotion) {
            var motivator = currentBasket ? checkMotivator(promotion) : false;
            var calloutMsg = promotion.calloutMsg ? promotion.calloutMsg.markup : '';
            var isPWPPromo = 'custom' in promotion && 'isPWP' in promotion.custom && promotion.custom.isPWP ? promotion.custom.isPWP : false;
            return {
                calloutMsg: calloutMsg,
                motivator: motivator,
                details: promotion.details ? promotion.details.markup : '',
                enabled: promotion.enabled,
                id: promotion.ID,
                name: promotion.name,
                promotionClass: promotion.promotionClass,
                rank: promotion.rank,
                isPWPPromo: isPWPPromo
            };
        })
    });
};
