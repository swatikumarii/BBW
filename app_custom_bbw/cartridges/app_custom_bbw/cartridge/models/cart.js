'use strict';

var base = module.superModule;

var formatMoney = require('dw/util/StringUtils').formatMoney;
var collections = require('*/cartridge/scripts/util/collections');
var Money = require('dw/value/Money');

var TotalsModel = require('*/cartridge/models/totals');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var isAfterPayAvailable = Site.getCurrent().getCustomPreferenceValue('enableAfterpay');
var apUtilities;
if (isAfterPayAvailable) {
    apUtilities = require('*/cartridge/scripts/util/afterpayUtilities');
}

/**
 * Generates an object of approaching discounts
 * @param {dw.order.Basket} basket - Current users's basket
 * @param {dw.campaign.DiscountPlan} discountPlan - set of applicable discounts
 * @returns {object} an object of approaching discounts
 */
function getApproachingDiscounts(basket, discountPlan) {
    var approachingOrderDiscounts;
    var approachingShippingDiscounts;
    var orderDiscountObject;
    var shippingDiscountObject;
    var discountObject;
    var promotion;
    var appliedOrderDiscounts;
    var appliedBonusDiscounts;
    var appliedShippingDiscounts;

    if (basket && basket.productLineItems) {
        approachingOrderDiscounts = discountPlan.getApproachingOrderDiscounts();
        approachingShippingDiscounts =
            discountPlan.getApproachingShippingDiscounts(
                basket.defaultShipment
            );
        appliedShippingDiscounts = discountPlan.getShippingDiscounts(basket.defaultShipment);

        orderDiscountObject = collections.map(
            approachingOrderDiscounts,
            function (approachingOrderDiscount) {
                promotion = approachingOrderDiscount.discount.promotion;
                var qualificationMessage = promotion.custom && promotion.custom !== null && 'qualificationMessage' in promotion.custom && promotion.custom.qualificationMessage ? promotion.custom.qualificationMessage.source : false;
                var motivatorHeading =  promotion.custom && promotion.custom !== null && 'orderMotivatorHeading' in promotion.custom && promotion.custom.orderMotivatorHeading ? promotion.custom.orderMotivatorHeading.source : '';
                var buy = formatMoney(approachingOrderDiscount.getDistanceFromConditionThreshold());
                var get = promotion.custom && promotion.custom !== null && 'Get' in promotion.custom && promotion.custom.Get.length > 0 ? promotion.custom.Get[0] : '';
                var image = promotion.custom && 'productToShowImage' in promotion.custom ? ProductMgr.getProduct(promotion.custom.productToShowImage).getImage('large').absURL.toString() : '';
                var discountMsg;
                if (qualificationMessage) {
                    discountMsg = qualificationMessage.replace('{{Buy}}', buy).replace('{{Get}}', get);
                } else {
                    discountMsg = Resource.msgf(
                        'msg.approachingpromo',
                        'cart',
                        null,
                        formatMoney(
                            approachingOrderDiscount.getDistanceFromConditionThreshold()
                        ),
                        approachingOrderDiscount
                            .getDiscount()
                            .getPromotion()
                            .getCalloutMsg()
                    );
                }
                return {
                    discountMsg: discountMsg,
                    conditionThreshold: approachingOrderDiscount.conditionThreshold.value,
                    distanceFromConditionThreshold: approachingOrderDiscount.distanceFromConditionThreshold.value,
                    image: image,
                    motivatorHeading: motivatorHeading
                };
            }
        );

        if (orderDiscountObject.length === 0) {
            appliedOrderDiscounts = discountPlan.getOrderDiscounts();
            appliedBonusDiscounts = discountPlan.getBonusDiscounts();
            var discountMsg;
            var thresholdValue = 0;
            var motivatorHeading;
            var image;
            if (appliedOrderDiscounts.length > 0) {
                collections.forEach(appliedOrderDiscounts, function (appliedOrderDiscount) {
                    if ('custom' in appliedOrderDiscount.promotion &&
                        'showProgressBar' in appliedOrderDiscount.promotion.custom &&
                        appliedOrderDiscount.promotion.custom.showProgressBar &&
                        'Buy' in appliedOrderDiscount.promotion.custom &&
                        appliedOrderDiscount.promotion.custom.Buy &&
                        appliedOrderDiscount.promotion.custom.Buy.length > 0 &&
                        'addFreeMessage' in appliedOrderDiscount.promotion.custom &&
                        'productToShowImage' in appliedOrderDiscount.promotion.custom &&
                        appliedOrderDiscount.promotion.custom.Buy[appliedOrderDiscount.promotion.custom.Buy.length - 1] > thresholdValue
                    ) {
                        thresholdValue = appliedOrderDiscount.promotion.custom.Buy[appliedOrderDiscount.promotion.custom.Buy.length - 1];
                        discountMsg = appliedOrderDiscount.promotion.custom.addFreeMessage.source;
                        image = appliedOrderDiscount.promotion.custom && 'productToShowImage' in appliedOrderDiscount.promotion.custom ? ProductMgr.getProduct(appliedOrderDiscount.promotion.custom.productToShowImage).getImages('large')[0].absURL.toString() : '';
                        motivatorHeading =  appliedOrderDiscount.promotion.custom && appliedOrderDiscount.promotion.custom !== null && 'orderMotivatorHeading' in appliedOrderDiscount.promotion.custom && appliedOrderDiscount.promotion.custom.orderMotivatorHeading ? appliedOrderDiscount.promotion.custom.orderMotivatorHeading.source : '';
                    }
                });

                if(discountMsg && discountMsg !== '') {
                    orderDiscountObject = [];
                    orderDiscountObject.push({
                        discountMsg: discountMsg,
                        conditionThreshold: thresholdValue,
                        distanceFromConditionThreshold: 0,
                        image: image,
                        motivatorHeading: motivatorHeading
                    });
                }
            }
            if (appliedBonusDiscounts.length > 0) {
                collections.forEach(appliedBonusDiscounts, function (appliedOrderDiscount) {
                    if ('custom' in appliedOrderDiscount.promotion &&
                        'showProgressBar' in appliedOrderDiscount.promotion.custom &&
                        appliedOrderDiscount.promotion.custom.showProgressBar &&
                        'Buy' in appliedOrderDiscount.promotion.custom &&
                        appliedOrderDiscount.promotion.custom.Buy &&
                        appliedOrderDiscount.promotion.custom.Buy.length > 0 &&
                        'addFreeMessage' in appliedOrderDiscount.promotion.custom &&
                        'productToShowImage' in appliedOrderDiscount.promotion.custom &&
                        appliedOrderDiscount.promotion.custom.Buy[appliedOrderDiscount.promotion.custom.Buy.length - 1] > thresholdValue
                    ) {
                        thresholdValue = appliedOrderDiscount.promotion.custom.Buy[appliedOrderDiscount.promotion.custom.Buy.length - 1];
                        discountMsg = appliedOrderDiscount.promotion.custom.addFreeMessage.source;
                        image = appliedOrderDiscount.promotion.custom && 'productToShowImage' in appliedOrderDiscount.promotion.custom ? ProductMgr.getProduct(appliedOrderDiscount.promotion.custom.productToShowImage).getImages('large')[0].absURL.toString() : '';
                        motivatorHeading =  appliedOrderDiscount.promotion.custom && appliedOrderDiscount.promotion.custom !== null && 'orderMotivatorHeading' in appliedOrderDiscount.promotion.custom && appliedOrderDiscount.promotion.custom.orderMotivatorHeading ? appliedOrderDiscount.promotion.custom.orderMotivatorHeading.source : '';
                    }
                });

                if(discountMsg && discountMsg !== '') {
                    orderDiscountObject = [];
                    orderDiscountObject.push({
                        discountMsg: discountMsg,
                        conditionThreshold: thresholdValue,
                        distanceFromConditionThreshold: 0,
                        image: image,
                        motivatorHeading: motivatorHeading
                    });
                }
            }
        }

        shippingDiscountObject = collections.map(
            approachingShippingDiscounts,
            function (approachingShippingDiscount) {
                return {
                    discountMsg: Resource.msgf(
                        'add.more.for.free.shipping',
                        'cart',
                        null,
                        formatMoney(
                            approachingShippingDiscount.getDistanceFromConditionThreshold()
                        ),
                        approachingShippingDiscount
                            .getDiscount()
                            .getPromotion()
                            .getCalloutMsg()
                    ),
                    conditionThreshold: approachingShippingDiscount.conditionThreshold.value,
                    formattedConditionThreshold: formatMoney(approachingShippingDiscount.conditionThreshold),
                    distanceFromConditionThreshold: approachingShippingDiscount.distanceFromConditionThreshold.value,
                    condition: approachingShippingDiscount.discount.promotion && 'custom' in approachingShippingDiscount.discount.promotion && 'shippingMotivatorCondition' in approachingShippingDiscount.discount.promotion.custom ? approachingShippingDiscount.discount.promotion.custom.shippingMotivatorCondition.markup : ''
                };
            }
        );

        if (shippingDiscountObject.length === 0) {
            shippingDiscountObject = collections.map(
                appliedShippingDiscounts,
                function (appliedShippingDiscount) {
                    var conditionThreshold = 'custom' in appliedShippingDiscount.promotion && 'Buy' in appliedShippingDiscount.promotion.custom &&
                            appliedShippingDiscount.promotion.custom.Buy && appliedShippingDiscount.promotion.custom.Buy.length > 0 ? appliedShippingDiscount.promotion.custom.Buy[appliedShippingDiscount.promotion.custom.Buy.length - 1] : 0;
                    return {
                        discountMsg: Resource.msg(
                            'congrats.free.shipping',
                            'cart',
                            null,
                        ),
                        conditionThreshold: conditionThreshold,
                        formattedConditionThreshold: formatMoney(new Money(conditionThreshold, basket.currencyCode)),
                        distanceFromConditionThreshold: 0,
                        condition: appliedShippingDiscount.promotion && 'custom' in appliedShippingDiscount.promotion && 'shippingMotivatorCondition' in appliedShippingDiscount.promotion.custom ? appliedShippingDiscount.promotion.custom.shippingMotivatorCondition.markup : ''
                    };
                }
            );
        }

        discountObject = {
            orderDiscountObject: orderDiscountObject,
            shippingDiscountObject: shippingDiscountObject
        };
    }
    return discountObject;
}

/**
 * Returns Free shippung status
 * @param {dw.order.Basket} basket - Current users's basket
 * @returns {boolean}  - free shupping status
 */
function getFreeShippingStatus(basket) {
    var status=false;
    if (basket && basket.allShippingPriceAdjustments && basket.allShippingPriceAdjustments.length) {
        if (basket.allShippingPriceAdjustments[0].appliedDiscount && basket.allShippingPriceAdjustments[0].appliedDiscount.type === 'FREE'){
            status = true;
        }
    }
    return status;
}

/**
 * Returns free line item counts
 * @param {Array} items - Current users's basket line items
 * @returns {number}  - free item count
 */
function getFreeItemCount(items) {
    var freeItemCount = 0;
    for (var i = 0; i < items.length; i++) {
        freeItemCount = ('priceValue' in items[i].priceTotal && items[i].priceTotal.priceValue <= 0) ? freeItemCount + items[i].quantity : freeItemCount;
    }
    return freeItemCount;
}
/**
 * @class
 * @classdesc CartModel class that represents the current basket
 * @param {object} basket - dw.order.Basket Current users's basket
 */
function CartModel(basket) {
    base.call(this, basket);
    var totalsModel = new TotalsModel(basket);
    this.totalPrice =  totalsModel.subTotal;
    this.hasFreeShipping = getFreeShippingStatus(basket);
    if (isAfterPayAvailable) {
        this.apEligible = apUtilities.brandUtilities.isAfterpayApplicable();
        this.classname = 'cart-afterpay-message';
    }
    this.continueShoppingLink = URLUtils.url('Home-Show').toString();
    // get free item count
    this.freeItemCount = getFreeItemCount(this.items);
    this.freeItemToastMessage = this.freeItemCount > 0 ? Resource.msgf('cart.free.item.message', 'cart', null, this.freeItemCount) : '';
    if (basket) {
        var discountPlan = PromotionMgr.getDiscounts(basket);
        if (discountPlan) {
            var approachingDiscounts = getApproachingDiscounts(
                basket,
                discountPlan
            );
            this.orderApproachingDiscounts = approachingDiscounts.orderDiscountObject;
            this.shippingApproachingDiscounts = approachingDiscounts.shippingDiscountObject;
        }
    }


    this.resources = {
        numberOfItems: Resource.msgf(
            'label.number.items.in.cart',
            'cart',
            null,
            this.numItems
        ),
        minicartCountOfItems: Resource.msgf(
            'minicart.count',
            'common',
            null,
            this.numItems
        ),
        emptyCartMsg: Resource.msg(
            'info.cart.empty.msg',
            'cart',
            null
        ),
        continueShoppingMsg: Resource.msg(
            'link.continue.shopping',
            'cart',
            null
        ),
        couponApplied: Resource.msg(
            'coupon.applied.successfully',
            'cart',
            null
        )
    };
}
module.exports = CartModel;
