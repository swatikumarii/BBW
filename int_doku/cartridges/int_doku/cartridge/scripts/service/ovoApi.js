'use strict';
var dokuPreference = require('*/cartridge/scripts/service/dokuPreference');
var dokuInitService = require('*/cartridge/scripts/service/init/dokuService');
var ovoHelper = require('*/cartridge/scripts/helpers/ovoHelper');


/**
 * getServiceCredentialsUrl function is responsible to fetch api url from doku service credentials
 * @return {Object} Service Credentials
 */
function getServiceCredentialsUrl() {
  var service = dokuInitService.dokuService;
  var serviceCredentials = service.getConfiguration().getCredential();
  return serviceCredentials.getURL() + 'ovo-emoney/v1/payment';
}


/**
 * receiveOvoPayment function is responsible to hit api to accept payment through OVO Wallet
 * @return {Object} Paymnent Status
 */
function receiveOvoPayment(order, reqOrder) {
  var service = dokuInitService.dokuService;
  var url = getServiceCredentialsUrl();
  var requestJSON = {};
  var serviceResponse = {};
  var amount = reqOrder.amount;
  var checkSum = ovoHelper.generateSecurityChecksum(amount, dokuPreference.client_id, order.currentOrderNo, order.custom.ovoID, dokuPreference.secretKey);
  requestJSON.client = { id: dokuPreference.client_id };
  requestJSON.order = reqOrder;
  requestJSON.ovo_info = { ovo_id: order.custom.ovoID };
  requestJSON.security = { check_sum: checkSum };

  service.setURL(url);
  service.Encoding = 'gzip, deflate, br';
  service.setRequestMethod('POST');
  serviceResponse = service.call(JSON.stringify(requestJSON));
  if (serviceResponse.status === 'OK') {
    return JSON.parse(serviceResponse.object);
  }
  return { error: true,
    reason: 'Time Out'
  };
}

module.exports = {
  receiveOvoPayment: receiveOvoPayment
};
