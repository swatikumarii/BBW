'use strict';

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var handleOrderConfirm = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/order');
var payment = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/payment');
var Transaction = require('dw/system/Transaction');

/**
 *
 * @param {object} adyenPaymentInstrument - adyenPaymentInstrument
 * @param {object} detailsResult - detailsResult
 * @param {object} order - order
 * @param {object} options - options
 * @returns {object} handle payment
 */
function handleAuthorised(adyenPaymentInstrument, detailsResult, order, options) {
    var Order = require('dw/order/Order');
    // custom fraudDetection
    var fraudDetectionStatus = {
        status: 'success'
    };

    // Places the order
    var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
        return payment.handlePaymentError(order, 'placeOrder', options);
    }
    Transaction.wrap(function () {
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
    });
    COHelpers.sendConfirmationEmail(order, request.locale);
    return handleOrderConfirm(adyenPaymentInstrument, detailsResult, order, options);
}
module.exports = handleAuthorised;
