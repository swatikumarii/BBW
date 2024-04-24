'use strict';

var base = module.superModule;

var TotalsModel = require('*/cartridge/models/totals');
var apUtilities = require('*/cartridge/scripts/util/afterpayUtilities');

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
}
module.exports = CartModel;
