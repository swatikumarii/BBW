'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Begin', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ShippingMgr = require('dw/order/ShippingMgr');
    var Transaction = require('dw/system/Transaction');
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
    if (viewData.currentStage === 'payment' && !(viewData.order &&  'shipping' in viewData.order && viewData.order.shipping.length > 0 && viewData.order.shipping[0].selectedShippingMethod && viewData.order.shipping[0].shippingAddress) && !isGiftProductAvailable) {
        var applicableShippingMethods = ShippingMgr.getShipmentShippingModel(
            currentBasket.getDefaultShipment()
        ).getApplicableShippingMethods();
        if (applicableShippingMethods && applicableShippingMethods.length > 0) {
            Transaction.wrap(function () {
                currentBasket.getDefaultShipment().setShippingMethod(applicableShippingMethods[0]);
            });
        }
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
    // set dialCode in billing and shipping form
    if (currentBasket.getDefaultShipment().shippingAddress) {
        viewData.forms.shippingForm.shippingAddress.addressFields.dialCode.htmlValue = currentBasket.getDefaultShipment().shippingAddress.custom.dialCode;
        viewData.forms.shippingForm.shippingAddress.addressFields.dialCodeCountry.htmlValue = currentBasket.getDefaultShipment().shippingAddress.custom.dialCodeCountry;
    }
    if (currentBasket.billingAddress) {
        viewData.forms.billingForm.addressFields.dialCode.htmlValue = currentBasket.billingAddress.custom.dialCode;
        viewData.forms.billingForm.addressFields.dialCodeCountry.htmlValue = currentBasket.billingAddress.custom.dialCodeCountry;
    }
    var isDangerousGoodsInBasket=false;
    var CartModel = require('*/cartridge/models/cart');
    var basketModel = new CartModel(currentBasket);
    for (var i = 0; i < basketModel.items.length; i++) {
        if (basketModel.items[i].dangerousGoods) {
            isDangerousGoodsInBasket = true;
            break;
        }
    }
    viewData.isDangerousGoodsInBasket = isDangerousGoodsInBasket;
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

server.post('UpdateShippingMethods', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var ShippingMgr = require('dw/order/ShippingMgr');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var collections = require('*/cartridge/scripts/util/collections');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = currentBasket.defaultShipment;
    var stateCode = req.querystring.stateCode;
    var appliedShippingMethodID = currentBasket.getDefaultShipment().shippingMethodID;
    Transaction.wrap(function () {
        var shippingAddress = shipment.shippingAddress;

        if (!shippingAddress) {
            shippingAddress = shipment.createShippingAddress();
        }
        shippingAddress.stateCode = stateCode;
        var applicableShippingMethods = ShippingMgr.getShipmentShippingModel(
            currentBasket.getDefaultShipment()
        ).getApplicableShippingMethods();
        var applicableShippingMethodsIDs = collections.map(applicableShippingMethods, function (applicableShippingMethod) {
            return applicableShippingMethod.ID;
        });
        if (!applicableShippingMethodsIDs.includes(appliedShippingMethodID)) {
            Transaction.wrap(function () {
                currentBasket.getDefaultShipment().setShippingMethod(applicableShippingMethods[0]);
                basketCalculationHelpers.calculateTotals(currentBasket);
            });
        }

    });
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });
    var currentLocale = Locale.getLocale(req.locale.id);
    var basketModel = new OrderModel(
        currentBasket,
        { usingMultiShipping: false, countryCode: currentLocale.country, containerView: 'basket' }
    );

    res.json({
        customer: new AccountModel(req.currentCustomer),
        order: basketModel,
        shippingForm: server.forms.getForm('shipping')
    });
    next();
});

module.exports = server.exports();
