'use strict';

var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var encryptionHelper = require('*/cartridge/scripts/helpers/encryptionHelpers');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
var URLUtils = require('dw/web/URLUtils');
var emailContentHelpers = require('*/cartridge/scripts/helpers/emailContentHelpers');

// Function used to send EInvoice email
exports.sendEmail = function (order) {
    var emailObj = {
        to: order.customerEmail,
        subject: Resource.msg('email.subject.einvoice', 'einvoice', null),
        from:
            Site.current.getCustomPreferenceValue('customerServiceEmail') ||
            'no-reply@testorganization.com'
    };
    var encodedOrderNumber = encodeURIComponent(
        encryptionHelper.encryptPin(order.orderNo)
    );
    emailHelpers.sendEmail(emailObj, 'mail/einvoiceEmail', {
        invoiceUrl: URLUtils.https(
            'Order-InvoiceDownload',
            'token',
            encodedOrderNumber
        ).toString(),
        content: emailContentHelpers.getEmailContent(
            'normal-footer',
            'email-header'
        )
    });
};

// Function used to send Failed EInvoice email
exports.sendFailedEmail = function (order) {
    var emailObj = {
        to: order.customerEmail,
        subject: Resource.msg(
            'email.subject.einvoice.rejected',
            'einvoice',
            null
        ),
        from:
            Site.current.getCustomPreferenceValue('customerServiceEmail') ||
            'no-reply@testorganization.com'
    };
    emailHelpers.sendEmail(emailObj, 'mail/einvoiceEmailRejected', {
        orderId: order.orderNo,
        content: emailContentHelpers.getEmailContent(
            'normal-footer',
            'email-header'
        )
    });
};
