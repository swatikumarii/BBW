'use strict';

/**
 * @namespace Order
 */

var server = require('server');
server.extend(module.superModule);

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var encryptionHelper = require('*/cartridge/scripts/helpers/encryptionHelpers');

/**
 * Order-Failed : This endpoint is invoked when the shopper's Order is Placed and Failed
 * @name Order-Failed
 * @function
 * @memberof Order
 * @param {middleware} middleware - consentTracking.consent
 * @param {middleware} middleware - server.middleware.https
 */
server.get(
    'Failed',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        // var OrderModel = require('*/cartridge/models/order');

        var order;
        var orderID = session.privacy.orderNo;

        if (!orderID) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        order = OrderMgr.getOrder(orderID);

        if (!order || order.customer.ID !== req.currentCustomer.raw.ID
        ) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }
        res.render('checkout/failedOrder');
        return next();
    }
);

/**
 * Order-Pending : This endpoint is invoked when the shopper's Order is Placed and in pending state
 * @name Order-Pending
 * @function
 * @memberof Order
 * @param {middleware} middleware - consentTracking.consent
 * @param {middleware} middleware - server.middleware.https
 */
server.get(
    'Pending',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        // var OrderModel = require('*/cartridge/models/order');

        var order;
        var orderID = session.privacy.orderNo;

        if (!orderID) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        order = OrderMgr.getOrder(orderID);

        if (!order || order.customer.ID !== req.currentCustomer.raw.ID
        ) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }
        res.render('checkout/pendingOrder');
        return next();
    }
);

/**
 * This Route is to render order tracking form page
 */
server.get(
    'Status',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        res.render('account/orderTracking');
        return next();
    }
);

/**
 * This Route is to render order tracking form page
 */
server.get(
    'Tracking',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var Locale = require('dw/util/Locale');
        var OrderModel = require('*/cartridge/models/order');
        var orderId = encryptionHelper.decryptPin(
            decodeURIComponent(req.querystring.token)
        );
        if (orderId) {
            var order = OrderMgr.getOrder(orderId);
            if (order) {
                var currentLocale = Locale.getLocale(req.locale.id);

                var config = {
                    numberOfLineItems: 'single'
                };

                var orderModel = new OrderModel(order, {
                    config: config,
                    countryCode: currentLocale.country
                });
                res.render('account/orderDetail', {
                    order: orderModel,
                    accountlanding: false
                });
                return next();
            }
        }
        res.redirect(URLUtils.url('Home-Show'));
        return next();
    }
);

/**
 * Order-Tracking : This endpoint is used to track a placed Order
 * @name Order-Tracking
 */
server.post(
    'Check',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var error = orderHelpers.validateTrackingData(
            req.form.orderNumber, req.form.orderEmail, req.form.billingZipCode
        );
        if (error && error.length === 0) {
            var order = OrderMgr.getOrder(req.form.orderNumber);
            if (
                order &&
                order.customerEmail === req.form.orderEmail.trim() &&
                order.shipments[0].shippingAddress.postalCode ===
                    req.form.billingZipCode.trim()
            ) {
                res.json({
                    redirectUrl: URLUtils.url(
                        'Order-Tracking',
                        'token',
                        encryptionHelper.encryptPin(req.form.orderNumber)
                    ).toString()
                });
            } else {
                res.setStatusCode(400);
                res.json({
                    error: true,
                    message: Resource.msg(
                        'error.order.not.found',
                        'order',
                        null
                    )
                });
            }
        } else {
            res.setStatusCode(400);
            res.json({
                error: true,
                fieldErrors: error
            });
        }
        next();
    }
);

module.exports = server.exports();
