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
    // set dialCode in billing and shipping form
    if (currentBasket.getDefaultShipment().shippingAddress) {
        viewData.forms.shippingForm.shippingAddress.addressFields.dialCode.htmlValue = currentBasket.getDefaultShipment().shippingAddress.custom.dialCode;
        viewData.forms.shippingForm.shippingAddress.addressFields.dialCodeCountry.htmlValue = currentBasket.getDefaultShipment().shippingAddress.custom.dialCodeCountry;
    }
    if (currentBasket.billingAddress) {
        viewData.forms.billingForm.addressFields.dialCode.htmlValue = currentBasket.billingAddress.custom.dialCode;
        viewData.forms.billingForm.addressFields.dialCodeCountry.htmlValue = currentBasket.billingAddress.custom.dialCodeCountry;
    }
    res.setViewData(viewData);
    next();
});

/**
 * Sets email recommendations in basket.
 */
server.post('SetEmailRecommendations', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var BasketMgr = require('dw/order/BasketMgr');
    var confirmationEmailRecommendationPIDs = req.httpParameterMap.confirmationEmailRecommendationPIDs.value ? req.httpParameterMap.confirmationEmailRecommendationPIDs.value.split(',').slice(0,3) : null;
    var shipmentEmailRecommendationPIDs = req.httpParameterMap.shipmentEmailRecommendationPIDs.value ? req.httpParameterMap.shipmentEmailRecommendationPIDs.value.split(',').slice(0,3) : null;
    var deliveryEmailRecommendationPIDs = req.httpParameterMap.deliveryEmailRecommendationPIDs.value ? req.httpParameterMap.deliveryEmailRecommendationPIDs.value.split(',').slice(0,3) : null;
    var gcEmailRecommendationPIDs = req.httpParameterMap.gcEmailRecommendationPIDs.value ? req.httpParameterMap.gcEmailRecommendationPIDs.value.split(',').slice(0,3) : null;
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket) {
        var emailRecommendationPIDs = {
            confirmationEmailRecommendationPIDs: confirmationEmailRecommendationPIDs,
            shipmentEmailRecommendationPIDs: shipmentEmailRecommendationPIDs,
            deliveryEmailRecommendationPIDs: deliveryEmailRecommendationPIDs,
            gcEmailRecommendationPIDs: gcEmailRecommendationPIDs
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
