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
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 */
server.get(
    'Failed',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');

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
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 */
server.get(
    'Pending',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');

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

module.exports = server.exports();
