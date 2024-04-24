'use strict';

/**
 * @namespace Order
 */

var server = require('server');
server.extend(module.superModule);

var Resource = require('dw/web/Resource');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var URLUtils = require('dw/web/URLUtils');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

/**
 * Order-History : The Order-History append to update breadcrumbs
 * @name Order-History
 */
server.append(
    'History',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var viewData = res.getViewData();

        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg(
                    'page.title.myaccount',
                    'account',
                    null
                ),
                url: URLUtils.url('Account-Show').toString()
            },
            {
                htmlValue: Resource.msg('label.orderhistory', 'account', null),
                url: URLUtils.url('Address-List').toString()
            }
        ];
        viewData.breadcrumbs = breadcrumbs;

        res.setViewData(viewData);

        next();
    }
);

/**
 * Order-InvoiceDownload : The Order-InvoiceDownload endpoint get order details to download invoice
 * @name Order-AddProductFromOrder
 */
server.get('InvoiceDownload', function (req, res, next) {
    var encryptionHelper = require('*/cartridge/scripts/helpers/encryptionHelpers');
    var OrderMgr = require('dw/order/OrderMgr');
    var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
    var orderID = encryptionHelper.decryptPin(
        decodeURIComponent(req.querystring.token)
    );
    var order = OrderMgr.getOrder(orderID);

    if (order) {
        var orderModel = orderHelpers.getOrderDetailsByID(
            orderID,
            req.locale.id
        );
        res.render('order/invoiceDownload', {
            order: orderModel
        });
    } else {
        res.redirect(URLUtils.url('Order-History'));
    }
    next();
});


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

module.exports = server.exports();
