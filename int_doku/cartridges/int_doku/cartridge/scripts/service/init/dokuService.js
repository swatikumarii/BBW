'use strict';

/**
 * This is the Authentication service to communicate with doku
 */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var dokuService = LocalServiceRegistry.createService('doku_http_payment_service', {

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

exports.dokuService = dokuService;
