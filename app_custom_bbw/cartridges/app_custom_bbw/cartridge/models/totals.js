'use strict';

var base = module.superModule;
var formatMoney = require('dw/util/StringUtils').formatMoney;
var collections = require('*/cartridge/scripts/util/collections');
var Money = require('dw/value/Money');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

/**
 * Accepts a total object and formats the value
 * @param {dw.value.Money} total - Total price of the cart
 * @returns {string} the formatted money value
 */
function getTotals(total) {
    return !total.available ? '-' : formatMoney(total);
}

/**
 * getAllDiscounts returns all order and product level discounts
 * @param {object} lineItemContainer - basket or order collection
 * @returns {object} all discouunts and total discount
 */
function getAllDiscounts(lineItemContainer) {
    var totalDiscount = 0;
    var allDiscountItems = [];
    var allProductLineItems = lineItemContainer.allProductLineItems;
    var orderLevelpriceAdjustments = lineItemContainer.priceAdjustments;
    collections.forEach(allProductLineItems, function (productLineItem) {
        if (
            'priceAdjustments' in productLineItem &&
            productLineItem.priceAdjustments &&
            productLineItem.priceAdjustments.length > 0
        ) {
            collections.forEach(
                productLineItem.priceAdjustments,
                function (priceAdjustment) {
                    var discountObject = {
                        promotion: priceAdjustment.lineItemText,
                        discount: getTotals(priceAdjustment.grossPrice)
                    };
                    totalDiscount+= priceAdjustment.grossPrice.value;
                    allDiscountItems.push(discountObject);
                }
            );
        }
    });
    if (orderLevelpriceAdjustments.length > 0) {
        collections.forEach(
            orderLevelpriceAdjustments,
            function (orderLevelpriceAdjustment) {
                var discountObject = {
                    promotion: orderLevelpriceAdjustment.lineItemText,
                    discount: getTotals(orderLevelpriceAdjustment.grossPrice)
                };
                totalDiscount += orderLevelpriceAdjustment.grossPrice.value;
                allDiscountItems.push(discountObject);
            }
        );
    }
    return {
        allDiscountItems: allDiscountItems,
        totalDiscount: new Money(totalDiscount, lineItemContainer.currencyCode)
    };
};

/**
 * Adds discounts to a discounts object
 * @param {dw.util.Collection} collection - a collection of price adjustments
 * @param {object} discounts - an object of price adjustments
 * @returns {object} an object of price adjustments
 */
function createDiscountObject(collection, discounts) {
    var result = discounts;
    collections.forEach(collection, function (item) {
        if (!item.basedOnCoupon) {
            result[item.UUID] = {
                UUID: item.UUID,
                lineItemText: item.lineItemText,
                price: formatMoney(item.price),
                type: 'promotion',
                callOutMsg: (typeof item.promotion !== 'undefined' && item.promotion !== null) ? item.promotion.calloutMsg : ''
            };
        }
    });

    return result;
}

/**
 * creates an array of discounts.
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Array} an array of objects containing promotion and coupon information
 */
function getDiscounts(lineItemContainer) {
    var discounts = {};

    collections.forEach(lineItemContainer.couponLineItems, function (couponLineItem) {
        var priceAdjustments = collections.map(couponLineItem.priceAdjustments, function (priceAdjustment) {
            return { callOutMsg: (typeof priceAdjustment.promotion !== 'undefined' && priceAdjustment.promotion !== null) ? priceAdjustment.promotion.calloutMsg : '' };
        });
        discounts[couponLineItem.UUID] = {
            type: 'coupon',
            UUID: couponLineItem.UUID,
            couponCode: couponLineItem.couponCode,
            applied: couponLineItem.applied,
            valid: couponLineItem.valid,
            relationship: priceAdjustments,
            qualificationMsg: ''
        };
        if (!couponLineItem.applied) {
            var promotion = couponLineItem.promotion;
            if (
                promotion &&
                (couponLineItem.statusCode === 'NO_ACTIVE_PROMOTION' ||
                    couponLineItem.statusCode === 'NO_APPLICABLE_PROMOTION')
            ) {
                discounts[couponLineItem.UUID].qualificationMsg =
                    promotion.custom.qualificationMsg;
            } else {
                discounts[couponLineItem.UUID].qualificationMsg =
                    cartHelper.checkCouponCodeError(
                        couponLineItem.couponCode,
                        couponLineItem.statusCode
                    );
            }
        }
    });

    discounts = createDiscountObject(lineItemContainer.priceAdjustments, discounts);
    discounts = createDiscountObject(lineItemContainer.allShippingPriceAdjustments, discounts);

    return Object.keys(discounts).map(function (key) {
        return discounts[key];
    });
}

/**
 *
 * @param {Array} allDiscountItems - all discounts array
 * @param {string} totalDiscount - total discount amount
 * @returns {string} html content
 */
function getAllDiscountsHTML(allDiscountItems, totalDiscount) {
    var Template = require('dw/util/Template');
    var HashMap = require('dw/util/HashMap');
    var template = new Template('cart/cartDiscountsHtml');
    var context = new HashMap();
    var totalsObj = {
        totals:  {
            totalDiscountFormatted: getTotals(totalDiscount),
            allDiscounts: allDiscountItems
        }
    };
    Object.keys(totalsObj).forEach(function (key) {
        context.put(key, totalsObj[key]);
    });
    var content = template.render(context).text;
    return content;
}

/**
 * @class
 * @classdesc totals class that represents the order totals of the current line item container
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 */
function totals(lineItemContainer) {
    base.call(this, lineItemContainer);
    this.shippingTotalTax = getTotals(lineItemContainer.shippingTotalTax);
    this.shippingTotalExclTax = getTotals(lineItemContainer.adjustedShippingTotalNetPrice);
    this.subTotalExclTax = getTotals(lineItemContainer.adjustedMerchandizeTotalNetPrice);
    var allDiscounts = getAllDiscounts(lineItemContainer);
    this.allDiscounts = allDiscounts.allDiscountItems;
    this.totalDiscount = allDiscounts.totalDiscount;
    this.allDiscountsHTML = getAllDiscountsHTML(
        allDiscounts.allDiscountItems,
        allDiscounts.totalDiscount
    );
    this.totalDiscountFormatted = getTotals(allDiscounts.totalDiscount);
    this.discounts = getDiscounts(lineItemContainer);
}

module.exports = totals;

