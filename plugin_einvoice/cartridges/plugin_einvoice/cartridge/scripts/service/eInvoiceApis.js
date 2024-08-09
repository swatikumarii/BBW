'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var loggerEinvoice = Logger.getLogger('EInvoice');

/**
 * This is the Authentication service to communicate with PWC
 * @returns {object} - api response
 */
function getEInvoiceToken() {
    var serviceResponse;
    try {
        var eInvoiceServiceInit = require('*/cartridge/scripts/service/init/eInvoiceService');
        var service = eInvoiceServiceInit.eInvoiceTokenService;
        var serviceCredentials = service.getConfiguration().getCredential();
        var url = serviceCredentials.getURL();
        var params = {
            scope:
                Site.getCurrent().getCustomPreferenceValue('eInvoice_scope') ||
                '/.default',
            // eslint-disable-next-line camelcase
            client_id: serviceCredentials.user,
            // eslint-disable-next-line camelcase
            client_secret: serviceCredentials.password,
            // eslint-disable-next-line camelcase
            grant_type: 'client_credentials'
        };

        var formBody = Object.keys(params)
            .map(function(key) {
                return (
                    encodeURIComponent(key) +
                    '=' +
                    encodeURIComponent(params[key])
                );
            })
            .join('&');

        service.setURL(url);
        serviceResponse = service.call(formBody);
        serviceResponse.createdDate = new Date();
        serviceResponse.validTill = serviceResponse.created_Date.setSeconds(
            serviceResponse.created_Date.getSeconds() +
                serviceResponse.expires_in
        );
        return serviceResponse;
    } catch (error) {
        loggerEinvoice.error('Unhandled token exception : ' + error);
        return serviceResponse;
    }
}

/**
 * This is the post submission service to communicate with PWC
 * @param {object} requestBody - request data
 * @param {object} tokeninfo - token info to api
 * @param {object} refData - request data
 * @returns {object} - api response
 */
function postSubmission(requestBody, tokeninfo, refData) {
    var serviceResponse;
    try {
        var eInvoiceServiceInit = require('*/cartridge/scripts/service/init/eInvoiceService');
        var service = eInvoiceServiceInit.eInvoicePostSubmission;
        var serviceCredentials = service.getConfiguration().getCredential();
        var url = serviceCredentials.getURL();
        service.addHeader(
            'Authorization',
            tokeninfo.type + ' ' + tokeninfo.token
        );
        service.addHeader('ErpId', refData.eRP_ID);
        var userAgent =
            Site.getCurrent().getCustomPreferenceValue('eInvoice_user_agent') ||
            'eInvoice_json';
        service.addHeader('User-Agent', userAgent);
        service.setURL(url);
        serviceResponse = service.call(JSON.stringify(requestBody.jsonBody));
        return serviceResponse;
    } catch (error) {
        loggerEinvoice.error('Unhandled invoice submission exception : ' + error);
        return serviceResponse;
    }
}

/**
 * This is the get submission by ErpId service to communicate with PWC
 * @param {object} tokeninfo - token info to api
 * @param {object} refData - request data
 * @returns {object} - api response
 */
function getSubmission(tokeninfo, refData) {
    var serviceResponse;
    try {
        var eInvoiceServiceInit = require('*/cartridge/scripts/service/init/eInvoiceService');
        var service = eInvoiceServiceInit.eInvoiceGetSubmission;
        var serviceCredentials = service.getConfiguration().getCredential();
        var url = serviceCredentials
            .getURL()
            .replace('{{ErpId}}', refData.erpId);
        service.addHeader(
            'Authorization',
            tokeninfo.type + ' ' + tokeninfo.token
        );
        // service.addHeader('ErpId', refData.eRP_ID);
        var userAgent =
            Site.getCurrent().getCustomPreferenceValue('eInvoice_user_agent') ||
            'eInvoice_json';
        service.addHeader('User-Agent', userAgent);
        service.setURL(url);
        serviceResponse = service.call();
        return serviceResponse;
    } catch (error) {
        loggerEinvoice.error(
            'Unhandled get submission exception : ' + error
        );
        return serviceResponse;
    }
}

/**
 * This is the get qr code service to communicate with PWC
 * @param {object} tokeninfo - token info to api
 * @param {object} refData - request data
 * @returns {object} - api response
 */
function GetQRCode(tokeninfo, refData) {
    var serviceResponse;
    try {
        var eInvoiceServiceInit = require('*/cartridge/scripts/service/init/eInvoiceService');
        var service = eInvoiceServiceInit.eInvoiceGetQRCode;
        var serviceCredentials = service.getConfiguration().getCredential();
        var url = serviceCredentials
            .getURL()
            .replace('{{OutgoingInvoiceId}}', refData.invoiceId);
        service.addHeader(
            'Authorization',
            tokeninfo.type + ' ' + tokeninfo.token
        );
        // service.addHeader('ErpId', refData.eRP_ID);
        var userAgent =
            Site.getCurrent().getCustomPreferenceValue('eInvoice_user_agent') ||
            'eInvoice_json';
        service.addHeader('User-Agent', userAgent);
        service.setURL(url);
        serviceResponse = service.call();
        return serviceResponse;
    } catch (error) {
         loggerEinvoice.error('Unhandled QR code exception : ' + error);
        return serviceResponse;
    }
}

module.exports = {
    getEInvoiceToken: getEInvoiceToken,
    postSubmission: postSubmission,
    getSubmission: getSubmission,
    GetQRCode: GetQRCode
};
