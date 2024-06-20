'use strict';

var sendgridInitService = require('*/cartridge/scripts/service/init/sendgridService');

/**
 * getServiceCredentials function is responsible to fetch eGHL service credentials
 * @return {Object} Service Credentials
 */
function getServiceCredentials() {
    var service = sendgridInitService.sendgridService;
    var serviceCredentials = service.getConfiguration().getCredential();

    return {
        baseUrl: serviceCredentials.getURL()
    };
}
/**
 * checkPendingPaymentStatus function is responsible to check the eGHL pending payment status
 * @param  {Object} order Order object
 * @param  {Object} paymentRequest payment request object
 * @return {Object} result object with service response
 */
function sendEmail(emailRequest) {
    var sendgridPref = require('*/cartridge/scripts/service/sendgridPreference');
    var serviceCredentials = getServiceCredentials();
    var baseUrl = serviceCredentials.baseUrl + '/mail/send';
    var result = {
        error: false,
        response: []
    };
    // prepare service and call
    var service = sendgridInitService.sendgridService;
    service.setURL(baseUrl);
    service.addHeader('Authorization', 'Bearer ' + sendgridPref.sendgridApiKey + '');
    service.setRequestMethod('POST');
    var serviceResult = service.call(JSON.stringify(emailRequest));
    if (serviceResult.msg == 'Accepted' && serviceResult.status == 'OK') {
        result.response = serviceResult;
    } else {
        result.error = true;
        result.data = serviceResult;
    }
    return result;
}

module.exports = {
    getServiceCredentials: getServiceCredentials,
    sendEmail: sendEmail
};
