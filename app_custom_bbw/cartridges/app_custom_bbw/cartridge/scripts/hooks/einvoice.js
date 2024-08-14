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
    
    var qrCodeResponse = JSON.parse(order.custom.eInvoiceQrCode);    

    emailHelpers.sendEmail(emailObj, 'mail/einvoiceEmail', {
        orderNo:order.orderNo,
        qrCode:qrCodeResponse.qrcode,
        qrCodeLink:qrCodeResponse.url,
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

// Function used to convert date
function formatToISO8601(date) {
    // Get the components of the date
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    // Format the date and time components into ISO 8601 string
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+00:00`;
}

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

    var errorJson = JSON.parse(order.custom.einvoiceErrorMsg);

    emailHelpers.sendEmail(emailObj, 'mail/einvoiceEmailRejected', {
        errorMsg:
            'The error source is ' +
            errorJson.errorSource +
            '. The error is: ' +
            errorJson.detailedMessage +
            '.',
        submissionDate: formatToISO8601(new Date(order.custom.eInvoiceSubmittionDate)),
        erpId: order.custom.eInvoiceNumber,
        orderId: order.orderNo,
        content: emailContentHelpers.getEmailContent(
            'normal-footer',
            'email-header'
        )
    });
};
