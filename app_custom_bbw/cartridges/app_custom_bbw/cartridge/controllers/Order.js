'use strict';

/**
 * @namespace Order
 */

var server = require('server');
server.extend(module.superModule);

var Resource = require('dw/web/Resource');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

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
    'TrackingUrl',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var Locale = require('dw/util/Locale');
        var OrderModel = require('*/cartridge/models/order');
        var orderId = req.querystring.orderId;
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
        return next();
    }
);

/**
 * Order-Tracking : This endpoint is used to track a placed Order
 * @name Order-Tracking
 */
server.post(
    'Tracking',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var URLUtils = require('dw/web/URLUtils');
        if (req.form.orderEmail &&
            req.form.orderNumber &&
            req.form.billingZipCode
        ) {
            var order = OrderMgr.getOrder(req.form.orderNumber);
            if (order && order.customerEmail === req.form.orderEmail.trim() &&
                order.shipments[0].shippingAddress.postalCode ===
                    req.form.billingZipCode.trim()
            ) {
                res.json({
                    redirectUrl: URLUtils.url(
                        'Order-TrackingUrl',
                        'orderId',
                        req.form.orderNumber
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
                message: Resource.msg('order.status.not.found', 'order', null)
            });
        }
        next();
    }
);

module.exports = server.exports();
