'use strict';

/**
 * This is the Authentication service to communicate with PWC
 */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var eInvoiceTokenService = LocalServiceRegistry.createService(
    'EInvoiceRequestToken',
    {
        createRequest: function (svc, args) {
            svc.setRequestMethod('POST'); // or POST, PUT, DELETE, etc.
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
            return args;
        },

        parseResponse: function (svc, client) {
            return client.text;
        },

        filterLogMessage: function (msg) {
            //  No need to filter logs.  No sensitive information.
            return msg;
        }
    }
);

/**
 * This is the EInvoice Post Submission service to communicate with PWC
 */
var eInvoicePostSubmission = LocalServiceRegistry.createService(
    'EInvoicePostSubmission',
    {
        createRequest: function (svc, args) {
            svc.setRequestMethod('POST'); // or POST, PUT, DELETE, etc
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
    }
);

/**
 * This is the EInvoice Get Submission By ErpId service to communicate with PWC
 */
var eInvoiceGetSubmission = LocalServiceRegistry.createService(
    'EInvoiceGetSubmissionByErpId',
    {
        createRequest: function (svc, args) {
            svc.setRequestMethod('GET'); // or POST, PUT, DELETE, etc
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
    }
);

/**
 * This is the get QRCode service
 */
var eInvoiceGetQRCode = LocalServiceRegistry.createService(
    'EInvoiceGetQRCode',
    {
        createRequest: function (svc, args) {
            svc.setRequestMethod('GET'); // or POST, PUT, DELETE, etc
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
    }
);

/**
 * This is to upload the EInvoice QRCode on S3
 */
var eInvoiceQRCodeUpload = LocalServiceRegistry.createService(
    'EInvoiceS3Bucket',
    {
        createRequest: function (svc, args) {
            svc.setRequestMethod('POST'); // or POST, PUT, DELETE, etc
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
    }
);

module.exports = {
    eInvoiceTokenService: eInvoiceTokenService,
    eInvoicePostSubmission: eInvoicePostSubmission,
    eInvoiceGetSubmission: eInvoiceGetSubmission,
    eInvoiceGetQRCode: eInvoiceGetQRCode,
    eInvoiceQRCodeUpload: eInvoiceQRCodeUpload
};
