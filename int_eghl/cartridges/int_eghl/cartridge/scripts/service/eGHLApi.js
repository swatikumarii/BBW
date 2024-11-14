'use strict';

var eghlInitService = require('*/cartridge/scripts/service/init/eGHLService');

/**
 * getServiceCredentials function is responsible to fetch eGHL service credentials
 * @return {Object} Service Credentials
 */
function getServiceCredentials() {
    var service = eghlInitService.eghlService;
    var serviceCredentials = service.getConfiguration().getCredential();

    return {
        baseUrl: serviceCredentials.getURL(),
        user: serviceCredentials.user,
        password: serviceCredentials.password
    };
}
/**
 * checkPendingPaymentStatus function is responsible to check the eGHL pending payment status
 * @param  {Object} order Order object
 * @param  {Object} paymentRequest payment request object
 * @return {Object} result object with service response
 */
function checkPendingPaymentStatus(order) {
    var eghlHelper = require('*/cartridge/scripts/helpers/eghlHelper');
    var prepareRequestData = eghlHelper.eghlQueryRequest(order);
    var serviceCredentials = getServiceCredentials();
    var baseUrl = serviceCredentials.baseUrl + '?' + prepareRequestData;
    var result = {
        error: false,
        data: []
    };
    // prepare service and call
    var service = eghlInitService.eghlService;
    service.setURL(baseUrl);
    service.addHeader('Content-Type', 'application/x-www-form-urlencoded');
    service.setRequestMethod('POST');
    var serviceResult = service.call();
    if (serviceResult.msg == 'OK') {
        result.data = eghlHelper.prepareJsonObject(serviceResult.object);
    } else {
        result.error = true;
        result.data = serviceResult;
    }
    return result;
}

module.exports = {
    getServiceCredentials: getServiceCredentials,
    checkPendingPaymentStatus: checkPendingPaymentStatus
};
