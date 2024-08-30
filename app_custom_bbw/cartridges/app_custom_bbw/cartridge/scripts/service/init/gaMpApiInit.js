'use strict';

/**
 * This is the service to communicate with with GA using Measurement Protocol .
 */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var gaMpService = LocalServiceRegistry.createService('ga_mp_http_service', {

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

exports.gaMpService = gaMpService;
