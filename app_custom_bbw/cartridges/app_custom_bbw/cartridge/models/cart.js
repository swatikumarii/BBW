'use strict';

var base = module.superModule;

var TotalsModel = require('*/cartridge/models/totals');
var apUtilities = require('*/cartridge/scripts/util/afterpayUtilities');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

/**
 * @class
 * @classdesc CartModel class that represents the current basket
 * @param {object} basket - dw.order.Basket Current users's basket
 */
function CartModel(basket) {
    base.call(this, basket);
    var totalsModel = new TotalsModel(basket);
    this.totalPrice =  totalsModel.subTotal;
    this.apEligible = apUtilities.brandUtilities.isAfterpayApplicable();
    this.classname = 'cart-afterpay-message';
    this.continueShoppingLink = URLUtils.url('Home-Show').toString();


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
