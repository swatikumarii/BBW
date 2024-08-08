'use strict';

// dw imports
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');


/**
 * This function is using to create orders on capillary
 * @returns {any} Status with ok/error
 */
function execute() {
    try {
        var capillaryAPI = require('*/cartridge/scripts/service/capillaryApis');
        var OrderModel = require('*/cartridge/models/order');
        var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
        // fetch orders where don't have capillaryOrderID in order object
        var orderList = OrderMgr.queryOrders('custom.capillaryFailed = {0}', 'lastModified desc', true);
        // Loop through the order and process them as needed
        Transaction.wrap(function () {
            var failedOrders = [];
            var emailObj = {
                to: Site.current.getCustomPreferenceValue('capillaryOrderFailedEmail') || 'no-reply@salesforce.com',
                subject: Resource.msg('subject.capillary.order.failed.email', 'order', null),
                from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
                type: 1
            };
            while (orderList.hasNext()) {
                var order = orderList.next();
                var orderModel = new OrderModel(order, { containerView: 'order' });
                var crmOrderID = '';
                var sendFailedOrderFlag = false;
                if (order.customerNo) {
                    // Capillary: create order
                    crmOrderID = capillaryAPI.createOrder(orderModel, order);
                    if (crmOrderID) {
                        order.custom.capillaryOrderID = crmOrderID;
                        order.custom.capillaryResponse = '';
                        order.custom.capillaryRequest = '';
                        order.custom.capillaryFailed = false;
                    } else {
                        sendFailedOrderFlag = true;
                    }
                } else {
                    var billingAddress = orderModel.billing.billingAddress.address;
                    var customerData = {
                        firstName : billingAddress.firstName,
                        lastName: billingAddress.lastName,
                        phone: billingAddress.phone,
                        email: orderModel.orderEmail,
                        dialCode: billingAddress.dialCode
                    };
                    var crmCustomerID = capillaryAPI.createCustomer(customerData, order);
                    if (crmCustomerID) {
                        crmOrderID = capillaryAPI.createOrder(orderModel);
                        if (crmOrderID) {
                            order.custom.capillaryOrderID = crmOrderID;
                            order.custom.capillaryResponse = '';
                            order.custom.capillaryRequest = '';
                            order.custom.capillaryFailed = false;
                        } else {
                            sendFailedOrderFlag = true;
                        }
                    } else {
                        sendFailedOrderFlag = true;
                    }
                }
                if (sendFailedOrderFlag === true) {
                    failedOrders.push(orderModel.orderNumber);
                }
            }
            if (sendFailedOrderFlag === true) {
                emailHelpers.sendEmail(emailObj, 'mail/capillaryFailedOrder', {
                    failedOrders: failedOrders
                });
            }
        });
        return new Status(Status.OK);
    } catch (exception) {
        return new Status(Status.ERROR, null, 'There was an error while executing capillary job step: createOrders');
    }
}
module.exports = {
    execute: execute
};
