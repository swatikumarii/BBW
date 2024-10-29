'use strict';

var Site = require('dw/system/Site');
var Locale = require('dw/util/Locale');
var Logger = require('dw/system/Logger').getLogger('middlewareOrderExport');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var service = LocalServiceRegistry.createService('orderExportMiddleware.http.post', {
    mockCall : function(service, params) {
        return {};
    },
    createRequest: function (service, params) {
        service.setRequestMethod('POST');
        if (params.URL && !empty(params.URL)) {
            service.URL = params.URL;
        }
        service.addHeader('Content-Type', 'application/json');
        service.addHeader('channel-name', Site.current.ID);
        service.addHeader('channel-country', Locale.getLocale(Site.current.defaultLocale).country);
        if (params.body) {
             return params.body;
        }
        return service;
    },
    parseResponse: function (service, serviceResponse) {
        return serviceResponse;
    },
    getRequestLogMessage: function(serviceRequest) {
        return serviceRequest;
    },
    getResponseLogMessage: function(serviceResponse) {
        return JSON.stringify(serviceResponse.getText());
    }
});

function executeService (requestObject) {
    var callResult = service.call({ body: JSON.stringify(requestObject) });

    return callResult;
}

exports.executeService = executeService;
