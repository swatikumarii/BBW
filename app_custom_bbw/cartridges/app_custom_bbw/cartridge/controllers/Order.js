'use strict';

/**
 * @namespace Order
 */

var server = require('server');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');


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


server.get(
    'InvoiceDownload',
    function (req, res, next) {
        var encryptionHelper = require('*/cartridge/scripts/helpers/encryptionHelpers');
        var OrderMgr = require('dw/order/OrderMgr');
        var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var orderID = encryptionHelper.decryptPin(decodeURIComponent(req.querystring.token));
        var order = OrderMgr.getOrder(orderID);

        if (order) {
            var orderModel = orderHelpers.getOrderDetailsByID(orderID, req.locale.id);
            res.render('order/invoiceDownload', {
                order: orderModel
            });
        } else {
            res.redirect(URLUtils.url('Order-History'));
        }
        next();
    }
);

module.exports = server.exports();
