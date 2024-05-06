/* eslint-disable consistent-return */

'use strict';

var logger = require('dw/system/Logger');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');

/**
 *  pipeline call to check the payment status
 */
function execute() {
    var Site = require('dw/system/Site');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var OrderModel = require('*/cartridge/models/order');
    var Resource = require('dw/web/Resource');
    var toEmailAddress = Site.current.getCustomPreferenceValue(
        'jobNotificationToEmail'
    );
    var ccEmailAddress = Site.current.getCustomPreferenceValue(
        'jobNotificationCCEmail'
    );
    try {
        var orders;
        var order = OrderMgr.searchOrders(
            'paymentStatus = {0} AND (status = {1} OR status = {2} OR status = {3}) AND (NOT custom.failedPaymentNotification = {4}) ',
            'creationDate asc',
            Order.PAYMENT_STATUS_NOTPAID,
            Order.ORDER_STATUS_COMPLETED,
            Order.ORDER_STATUS_NEW,
            Order.ORDER_STATUS_OPEN,
            true
        );
        if (orders.count > 0) {
            while (orders.hasNext()) {
                order = orders.next();
                var orderModel = new OrderModel(order, {
                    countryCode: '',
                    containerView: 'order'
                });

                var emailObj = {
                    to: toEmailAddress,
                    cc: ccEmailAddress,
                    subject: Resource.msgf(
                        'email.subject.order.payment.failure',
                        'order',
                        null,
                        orderModel.order.createdBy
                    ),
                    from:
                        Site.current.getCustomPreferenceValue(
                            'customerServiceEmail'
                        ) || 'no-reply@salesforce.com'
                };

                emailHelpers.sendEmail(emailObj, 'mail/paymentFail', {
                    order: orderModel
                });
                // eslint-disable-next-line no-loop-func
                Transaction.wrap(function () {
                    order.custom.failedPaymentNotification = true;
                });
            }
        }
    } catch (ex) {
        var exception = ex;
        logger.error('Error while fetching orders' + exception);
    }
}

module.exports = {
    execute: execute
};
