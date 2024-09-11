'use strict';

/**
 * This is the Authentication service to communicate with eGHL
 */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var eghlService = LocalServiceRegistry.createService('eghlPayments', {

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

exports.eghlService = eghlService;
