'use strict';

var server = require('server');
server.extend(module.superModule);

var australiaStates = {
    'australian capital territory':'ACT',
    'new south wales':'NSW',
    'northern territory':'NT',
    'queensland':'QLD',
    'south australia':'SA',
    'tasmania':'TAS',
    'victoria':'VIC',
    'western australia':'WA'
};

/**
 * Make a payment from inside a component (paypal)
 */
server.append('PaymentFromComponent',server.middleware.https, function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var viewData = res.getViewData();
    var reqDataObj = JSON.parse(req.form.data);
    var billingStateCode = '';
    var shippingStateCode = '';
    var order = OrderMgr.getOrder(viewData.orderNo);
    if (reqDataObj.customer.billingAddressDetails.stateCode) {
        if (Object.keys(australiaStates).indexOf(reqDataObj.customer.billingAddressDetails.stateCode.toLowerCase().trim()) !== -1) {
            billingStateCode = australiaStates[reqDataObj.customer.billingAddressDetails.stateCode.toLowerCase().trim()];
            Transaction.wrap(function () {
                order.billingAddress.stateCode = billingStateCode;
            });
        }
    }
    if (reqDataObj.customer.addressBook.preferredAddress.stateCode) {
        if (Object.keys(australiaStates).indexOf(reqDataObj.customer.addressBook.preferredAddress.stateCode.toLowerCase().trim()) !== -1) {
            shippingStateCode = australiaStates[reqDataObj.customer.addressBook.preferredAddress.stateCode.toLowerCase().trim()];
            Transaction.wrap(function () {
                order.shipments[0].shippingAddress.stateCode = shippingStateCode;
            });
        }
    }
    next();
});

module.exports = server.exports();
