'use strict';
var server = require('server');
var ISML = require('dw/template/ISML');

/**
 *
 */
server.get('Show', function Show(req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.render('einvoice/einvoice', {
        formAction: URLUtils.url('EInvoice-ResendEmail')
    });
    next();
});

/**
 *
 */
server.post('ResendEmail', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var customObjectMgr = require('dw/object/CustomObjectMgr');
    var einvoiveStatusCode = require('*/cartridge/scripts/constant/einvoice_constant');
    try {
        var CurrentHttpParameterMap = request.httpParameterMap;
        var orderNumber = CurrentHttpParameterMap.orderNumber.stringValue;
        // var requestBody = JSON.parse(req.body);
        var order = OrderMgr.getOrder(orderNumber);

        // Add entry in custom object to to retrigger email in next run
        if (order.custom.eInvoiceErpId) {
            if (
                order.custom.eInvoiceStatus ===
                    einvoiveStatusCode.EINVOICESTATUSCODES.PENDING ||
                order.custom.eInvoiceStatus ===
                    einvoiveStatusCode.EINVOICESTATUSCODES.SUCCESS
            ) {
                try {
                    var eInvoiceDetails = customObjectMgr.getCustomObject(
                        'eInvoiceDetails',
                        order.custom.eInvoiceErpId
                    );
                    if (!eInvoiceDetails) {
                        Transaction.wrap(function () {
                            var eInvoiceObj =
                                customObjectMgr.createCustomObject(
                                    'eInvoiceDetails',
                                    order.custom.eInvoiceErpId
                                );
                            eInvoiceObj.custom.orderId = order.orderNo;
                            eInvoiceObj.custom.eInvoiceId =
                                order.custom.eInvoiceNumber;
                        });
                        res.json({
                            type: einvoiveStatusCode.EINVOICESTATUSCODES
                                .SUCCESS,
                            message:
                                'The email will be sent to the customer shortly.'
                        });
                    } else {
                        res.json({
                            type: einvoiveStatusCode.EINVOICESTATUSCODES.ERROR,
                            message:
                                'Too many requests for the same order. Please wait! The email will be sent to the customer shortly.'
                        });
                    }
                } catch (ex) {
                    res.json({
                        type: einvoiveStatusCode.EINVOICESTATUSCODES.ERROR,
                        message:
                            'An error occurred while sending the e-invoice.'
                    });
                }
            } else if (
                order.custom.eInvoiceStatus ===
                einvoiveStatusCode.EINVOICESTATUSCODES.ERROR
            ) {
                // QR code is already generated else show proper message

                var errorJson = JSON.parse(order.custom.einvoiceErrorMsg);

                res.json({
                    type: einvoiveStatusCode.EINVOICESTATUSCODES.ERROR,
                    message:
                        'The error source is ' +
                        errorJson.errorSource +
                        '. The error is: ' +
                        errorJson.detailedMessage +
                        '.'
                });
            } else {
                res.json({
                    type: einvoiveStatusCode.EINVOICESTATUSCODES.ERROR,
                    message:
                        'The customer needs to request the E-Invoice either from the order confirmation page or the order details page within the "My Account" section.'
                });
            }
        } else {
            res.json({
                type: einvoiveStatusCode.EINVOICESTATUSCODES.ERROR,
                message:
                    'The customer needs to request the E-Invoice either from the order confirmation page or the order details page within the "My Account" section.'
            });
        }
        next();
    } catch (error) {
        res.json({
            type: einvoiveStatusCode.EINVOICESTATUSCODES.ERROR,
            message: 'An error occurred while sending the e-invoice.'
        });
        next();
    }
});

module.exports = server.exports();
