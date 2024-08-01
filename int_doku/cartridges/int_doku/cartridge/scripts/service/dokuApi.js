'use strict';
var dokuPreference = require('*/cartridge/scripts/service/dokuPreference');
var dokuInitService = require('*/cartridge/scripts/service/init/dokuService');
var dokuHelper = require('*/cartridge/scripts/helpers/dokuHelper');

/**
 * getServiceCredentialsUrl function is responsible to fetch api url from doku service credentials
 * @return {Object} Service Credentials
 */
function getServiceCredentialsUrl() {
  var service = dokuInitService.dokuService;
  var serviceCredentials = service.getConfiguration().getCredential();

  return serviceCredentials.getURL() + 'checkout/v1/payment';
}

/**
 * getServiceCredentialsUrl function is responsible to fetch api url from doku service credentials
 * @return {Object} Service Credentials
 */
function getServiceCredentialsStatusUrl() {
  var service = dokuInitService.dokuService;
  var serviceCredentials = service.getConfiguration().getCredential();
    return serviceCredentials.getURL() + 'orders/v1/status/';
}


/**
 * generatePaymentUrl function is responsible to generate the Payment Url for Doku Checkout Page
 * @param {object} requestJSON string
 * @return {string} payment url
 */
function generatePaymentUrl(requestJSON) {
  var service = dokuInitService.dokuService;
  var url = getServiceCredentialsUrl();
  var Requesturl = '/checkout/v1/payment';
  var requestTimestamp = new Date().toISOString().slice(0, 19) + 'Z';
  var requestId = dokuPreference.request_Id + JSON.parse(requestJSON).order.invoice_number;
  var digest = dokuHelper.generateDigest(requestJSON);
  var secret = dokuPreference.secretKey;
  var signature = dokuHelper.generateSignature(
    dokuPreference.client_id,
    requestId,
    requestTimestamp,
    Requesturl,
    digest,
    secret
  );
  var serviceResponse = {};
  var resHeaders = {};
  service.setURL(url);
  service.Encoding = 'gzip, deflate, br';
  service.setRequestMethod('POST');
  service.addHeader('Client-Id', dokuPreference.client_id);
  service.addHeader('Request-Id', requestId);
  service.addHeader('Request-Timestamp', requestTimestamp);
  service.addHeader('Signature', signature);
  serviceResponse = service.call(requestJSON);
  var resObj = JSON.parse(serviceResponse.object);
  resHeaders = resObj.response.headers;
  if (resHeaders.request_id == requestId && resHeaders.signature == signature) {
    return { url: resObj.response.payment.url,
      request_Id: resHeaders.request_id
    };
  } else {
    return { error: true, message: 'Signatures Do not Match' };
  }
}

/**
 * getOrderPaymentStatus function is responsible to check the Payment Status for order
 * @param {boolean} isDokuCallback string
 * @return {object} response from doku
 */
function getOrderPaymentStatus(orderID) {
  var serviceResponse = {};
  var service = dokuInitService.dokuService;
  var requestId = dokuPreference.request_Id + orderID;
  var Requesturl = '/orders/v1/status/' + requestId;
  var url = getServiceCredentialsStatusUrl() + requestId;
  var requestTimestamp = new Date().toISOString().slice(0, 19) + 'Z';
  var digest = 0;
  var secret = dokuPreference.secretKey;
  var signature = dokuHelper.generateSignature(
    dokuPreference.client_id,
    requestId,
    requestTimestamp,
    Requesturl,
    digest,
    secret
  );
  service.setURL(url);
  service.setRequestMethod('GET');
  service.addHeader('Client-Id', dokuPreference.client_id);
  service.addHeader('Request-Id', requestId);
  service.addHeader('Request-Timestamp', requestTimestamp);
  service.addHeader('Signature', signature);
  serviceResponse = service.call();
  return serviceResponse;
}
module.exports = {
  generatePaymentUrl: generatePaymentUrl,
  getOrderPaymentStatus: getOrderPaymentStatus
};
