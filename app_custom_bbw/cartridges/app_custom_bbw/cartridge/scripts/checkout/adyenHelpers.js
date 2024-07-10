'use strict';

var base = module.superModule;
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const { getPayments } = require('*/cartridge/scripts/checkout/utils/index');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Order = require('dw/order/Order');

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @returns {object} an error object
 */
function handlePayments(order) {
    if (order.totalNetPrice === 0.0) {
        return {};
    }
    if (order.paymentInstruments.length) {
        var result = getPayments(order);
        if (order.status.value === Order.ORDER_STATUS_FAILED) {
            COHelpers.sendFailedOrderEmail(order, request.locale);
        }
        return result;
    }
    Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
    });
    COHelpers.sendFailedOrderEmail(order, request.locale);
    return {
        error: true
    };
}
base.handlePayments = handlePayments;
module.exports = base;
