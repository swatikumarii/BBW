'use strict';

/**
 * @namespace CheckoutShippingServices
 */

var server = require('server');

server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.append(
    'SubmitShipping',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var BasketMgr = require('dw/order/BasketMgr');
        var ShippingMgr = require('dw/order/ShippingMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        var applicableShippingMethods = ShippingMgr.getShipmentShippingModel(currentBasket.getDefaultShipment()).getApplicableShippingMethods();
        if (!applicableShippingMethods.length) {
            res.setViewData({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();;
        }
        return next();
    }
);

module.exports = server.exports();
