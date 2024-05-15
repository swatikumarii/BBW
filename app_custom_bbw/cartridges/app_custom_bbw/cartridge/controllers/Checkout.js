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
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
