/* eslint-disable vars-on-top */
'use strict';
var _2c2pService = require('*/cartridge/scripts/service/init/2c2pService');
var _2c2pPreferences = require('*/cartridge/scripts/service/2c2pPreferences');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var logger = Logger.getLogger('2c2p');
/**
 * getServiceCredentials function is responsible to fetch 2c2p service credentials
 * @return {Object} Service Credentials
 */
function getServiceCredentials(serviceName) {
  var service = serviceName;
  var serviceCredentials = service.getConfiguration().getCredential();

  return {
    baseUrl: serviceCredentials.getURL(),
    user: serviceCredentials.user,
    password: serviceCredentials.password
  };
}

/**
 * generatePaymentUrl function is responsible to generate the Payment Url for 2c2p Checkout Page
 * @param {object} requestJSON string
 * @return {string} payment url
 */
function generatePaymentUrl(requestJSON) {
  logger.info('in Generate payment url with req body {0}', JSON.stringify(requestJSON));
  var service;
  service = _2c2pService._2c2pService;
  var url = getServiceCredentials(service).baseUrl + 'payment/pageRedirect';
  var serviceResponse = {};
  var responseObject;
  service.setURL(url);
  service.setRequestMethod('POST');
  if (!_2c2pPreferences._2c2pEncrypt) {
    service.addHeader('message_encrypt', false);
    logger.info('Message is not encrypted');
  }
  service.addHeader('Authorization', _2c2pPreferences.hsbcAuthorizationHeader);
  service.addHeader('x-hsbc-client-id', _2c2pPreferences.hsbcClient_id);
  service.addHeader('x-hsbc-client-secret', _2c2pPreferences.hsbcClientSecret);
  service.addHeader('x-hsbc-msg-encrypt-id', _2c2pPreferences.hsbcMerchantID + '+' +
    _2c2pPreferences.hsbcJWS + '+' + _2c2pPreferences.hsbcJWE);
  serviceResponse = service.call(JSON.stringify(requestJSON));
  logger.info('Service response is {0}', serviceResponse);
  logger.info('Service response object is {0}', serviceResponse.object);
  if (serviceResponse.status === 'OK') {
    responseObject = JSON.parse(serviceResponse.object);
    if ('api_gw' in responseObject && responseObject.api_gw.returnCode === '200') {
      return responseObject.response.system.redirectLink;
    }
  }
  return {
    error: true,
    message: serviceResponse.errorMessage
  };
}

/**
 * getPaymentStatus function is responsible to generate the Payment Url for 2c2p Checkout Page
 * @param {object} requestJSON string
 * @return {string} payment url
 */
function getPaymentStatus(orderID) {
  var service;
  service = _2c2pService._2c2pService;
  var url = getServiceCredentials(service).baseUrl + 'payment/enquiry';
  var serviceResponse = {};
  service.setURL(url);
  service.setRequestMethod('POST');
  if (!_2c2pPreferences._2c2pEncrypt) {
    service.addHeader('message_encrypt', false);
  }
  service.addHeader('x-hsbc-client-id', _2c2pPreferences.hsbcClient_id);
  service.addHeader('x-hsbc-client-secret', _2c2pPreferences.hsbcClientSecret);
  service.addHeader('x-hsbc-msg-encrypt-id', _2c2pPreferences.hsbcMerchantID + '+' +
    _2c2pPreferences.hsbcJWS + '+' + _2c2pPreferences.hsbcJWE);
  var enquiryRequestJSON = {};
  var transaction = {};
  var merchant = {};
  var resObject;
  transaction.txnRef = orderID;
  merchant.merId = _2c2pPreferences.hsbcMerchantID;
  enquiryRequestJSON = {
    transaction: transaction,
    merchant: merchant
  };

  serviceResponse = service.call(JSON.stringify(enquiryRequestJSON));
  if (serviceResponse.status === 'OK') {
    resObject = JSON.parse(serviceResponse.object);
    if ('api_gw' in resObject && resObject.api_gw.returnCode === '200') {
      return resObject;
    }
  }
  return {
    error: true,
    message: serviceResponse.errorMessage
  };
}

module.exports = {
  getServiceCredentials: getServiceCredentials,
  generatePaymentUrl: generatePaymentUrl,
  getPaymentStatus: getPaymentStatus
};
