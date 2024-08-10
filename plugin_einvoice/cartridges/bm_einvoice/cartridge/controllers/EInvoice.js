'use strict';

var ISML = require('dw/template/ISML');

/**
 *
 */
function Show() {
    ISML.renderTemplate('einvoice/einvoice', {});
}

/**
 *
 */
function ResendEmail() {
    var OrderMgr = require('dw/order/OrderMgr');
    try {
        var CurrentHttpParameterMap = request.httpParameterMap;
        var orderNumber = CurrentHttpParameterMap.orderNumber.stringValue;
        // var requestBody = JSON.parse(req.body);
        var order = OrderMgr.getOrder(orderNumber);

        // Add entry in custom object to to retrigger email in next run
        // QR code is already generated else show proper message
        ISML.renderTemplate('einvoice/einvoice', {
            message: 'Success'
        });
    } catch (error) {
        ISML.renderTemplate('einvoice/einvoice', {
            message: 'Error occurred when send e-invoice'
        });
    }
}

Show.public = true;
ResendEmail.public = true;

exports.Show = Show;
exports.ResendEmail = ResendEmail;
