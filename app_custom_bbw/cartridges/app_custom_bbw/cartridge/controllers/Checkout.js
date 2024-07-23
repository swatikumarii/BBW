'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Begin', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ShippingMgr = require('dw/order/ShippingMgr');
    var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    var isGiftProductAvailable = qwikcilverHelpers.validateGiftProduct(currentBasket);
    var viewData = res.getViewData();
    viewData.isGiftProductAvailable = isGiftProductAvailable;
    if (viewData.currentStage === 'customer') {
        viewData.currentStage = 'shipping';
    }
    if ((viewData.currentStage === 'customer' || viewData.currentStage === 'shipping') && isGiftProductAvailable) {
        viewData.currentStage = 'payment';
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

/**
 * Sets email recommendations in basket.
 */
server.post('SetEmailRecommendations', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var BasketMgr = require('dw/order/BasketMgr');
    var confirmationEmailRecommendationPIDs = req.httpParameterMap.confirmationEmailRecommendationPIDs.value ? req.httpParameterMap.confirmationEmailRecommendationPIDs.value.split(',') : null;
    var shipmentEmailRecommendationPIDs = req.httpParameterMap.shipmentEmailRecommendationPIDs.value ? req.httpParameterMap.shipmentEmailRecommendationPIDs.value.split(',') : null;
    var deliveryEmailRecommendationPIDs = req.httpParameterMap.deliveryEmailRecommendationPIDs.value ? req.httpParameterMap.deliveryEmailRecommendationPIDs.value.split(',') : null;
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket) {
        var emailRecommendationPIDs = {
            confirmationEmailRecommendationPIDs: confirmationEmailRecommendationPIDs,
            shipmentEmailRecommendationPIDs: shipmentEmailRecommendationPIDs,
            deliveryEmailRecommendationPIDs: deliveryEmailRecommendationPIDs
        };
        Transaction.wrap(function () {
            currentBasket.custom.emailRecommendationPids = JSON.stringify(emailRecommendationPIDs);
        });
    }
    res.json({
        message: 'Success'
    });
    next();
});

module.exports = server.exports();
