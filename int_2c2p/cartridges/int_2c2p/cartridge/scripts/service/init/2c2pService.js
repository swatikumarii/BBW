/* eslint-disable func-names */
'use strict';
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var _2c2pPreferences = require('*/cartridge/scripts/service/2c2pPreferences');
var _2c2pService;

/**
 * This is the Encrypt/Decrypt service to Encrypt & Decrypt 2c2p Req and Res
 */
var _2c2pEncryptService = LocalServiceRegistry.createService('2c2p_encryption_service', {

  createRequest: function (svc, args) {
    svc.addHeader('Content-Type', 'application/json');
    return args;
  },

  parseResponse: function (svc, client) {
    return client.text;
  },

  filterLogMessage: function (msg) {
      //  No need to filter logs.  No sensitive information.
    return msg;
  }
});

/**
 * encryptRequest function is responsible to encrypt Request JSON
 * @return {string} encrypted Request JSON
 */
function encryptRequest(requestJSON) {
  var service = _2c2pEncryptService;
  var url = _2c2pEncryptService.getConfiguration().getCredential().getURL() + '/enrcyptRequest';
  var encryptedJSON = {};
  service.setURL(url);
  service.setRequestMethod('POST');
  encryptedJSON = service.call(requestJSON);
  if (encryptedJSON.status === 'OK') {
    return encryptedJSON.object;
  }
  return {
    error: true,
    message: encryptedJSON.errorMessage
  };
}

/**
 * decryptRequest function is responsible to decrypt Respons object
 * @return {string} encrypted Request JSON
 */
function decryptRequest(requestJSON) {
  var service = _2c2pEncryptService;
  var url = _2c2pEncryptService.getConfiguration().getCredential().getURL() + '/decryptResponse';
  var decryptedJSON = {};
  var payload = {
    payload: requestJSON
  };
  service.setURL(url);
  service.setRequestMethod('POST');
  decryptedJSON = service.call(JSON.stringify(payload));
  if (decryptedJSON.status === 'OK') {
    return decryptedJSON.object;
  }
  return {
    error: true,
    message: decryptedJSON.errorMessage
  };
}

/**
 * This is the Authentication service to communicate with 2c2p
 */

_2c2pService = LocalServiceRegistry.createService('2c2p_http_service', {

  createRequest: function (svc, args) {
    svc.addHeader('Content-Type', 'application/json');
    if (_2c2pPreferences._2c2pEncrypt) {
      var encrypted = encryptRequest(args);
      if (encrypted.error) {
        return encrypted.message;
      }
      return encrypted;
    }
    return args;
  },

  parseResponse: function (svc, client) {
    if (_2c2pPreferences._2c2pEncrypt) {
      var decrypted = decryptRequest(client.text);
      if (decrypted.error) {
        return decrypted.message;
      }
      return decrypted;
    }
    return client.text;
  },

  filterLogMessage: function (msg) {
    return msg;
  }
});

module.exports = {
  _2c2pService: _2c2pService,
  encryptRequest: encryptRequest,
  decryptRequest: decryptRequest
};
