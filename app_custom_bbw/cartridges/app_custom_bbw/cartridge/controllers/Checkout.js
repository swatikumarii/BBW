'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Begin', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ShippingMgr = require('dw/order/ShippingMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();
    if (viewData.currentStage === 'customer') {
        viewData.currentStage = 'shipping';
    }
    var areShipmentsValid = ShippingMgr.getShipmentShippingModel(currentBasket.getDefaultShipment()).getApplicableShippingMethods();
    if (!areShipmentsValid.length) {
        viewData.containsDangerousGoods = true;
    }
    var userEmail = '';
    userEmail =
        viewData.order.billing.billingAddress.address &&
        viewData.order.billing.billingAddress.address.email
            ? viewData.order.billing.billingAddress.address.email
            : '';
    if (userEmail === '') {
        userEmail =
            viewData.customer &&
            viewData.customer.profile &&
            viewData.customer.profile.email ? viewData.customer.profile.email || '' : '';
    }
    viewData.userEmail = userEmail;
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
