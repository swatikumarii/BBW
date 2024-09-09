'use strict';

var Logger = require('dw/system/Logger');
var logger = Logger.getLogger('gaMpService');

/**
 * Add query parameters to URL
 * @param {string} url url
 * @param {object} params query params object
 * @returns {object} result
 */
function addQueryParams(url, params) {
    var newUrl = url;
    newUrl +=
        (newUrl.indexOf('?') !== -1 ? '&' : '?') +
        Object.keys(params)
            .map(function (key) {
                return key + '=' + encodeURIComponent(params[key]);
            })
            .join('&');

    return newUrl;
}

/**
 * Create service request object.
 * @param {string} orderId orderId
 * @param {object} paymentStatus payment Status
 * @returns {object} result
 */
function createGaServiceReqObject(orderId, paymentStatus) {
    // Random client ID as it does not affect because all calls will be coming from server
    var reqObj = {
        client_id: '11111111.111111111',
        non_personalized_ads: false,
        events: [
            {
                name: 'paymentStatus',
                params: {
                    orderId: orderId,
                    status: paymentStatus
                }
            }
        ]
    };
    return reqObj;
}

/**
 * GA Measurement Service API Call
 * @param {string} orderId method request
 * @param {string} paymentStatus method request
 * @returns {object} result
 */
function gaMpAPICall(orderId, paymentStatus) {
    var result;
    try {
        var gaMpApiInit = require('*/cartridge/scripts/service/init/gaMpApiInit');
        
        var requestObj = createGaServiceReqObject(orderId, paymentStatus);
        var service = gaMpApiInit.gaMpService;
        var serviceCredentials = service.getConfiguration().getCredential();
        var baseURL = serviceCredentials.getURL();
        var apiSecret = dw.system.Site.getCurrent().getCustomPreferenceValue('gaMpApiSecret') || '';
        var measurementId = dw.system.Site.getCurrent().getCustomPreferenceValue('gaMeasurementId') || '';
        var endPoint = '/mp/collect';
        var url = baseURL + endPoint;
        var queryObject = {
            api_secret: apiSecret,
            measurement_id: measurementId
        };
        url = addQueryParams(url, queryObject);

        service.setURL(url);
        service.setRequestMethod('POST');
        logger.info('GaMp Service request{0}', JSON.stringify(requestObj));
        var requestJSON = JSON.stringify(requestObj);
        result = service.call(requestJSON);

        if (result.status === 'OK') {
            var resultObject = JSON.stringify(result.object);
            logger.info('GaMp Service response{0}', resultObject);
        } else {
            logger.info('GaMp Service  Error{0}', JSON.stringify(result));
        }
        return result;
    } catch (e) {
        logger.error(
            'Error in Qwikcilver Service: {0}, {1}',
            e.message,
            e.lineNumber
        );
    }
    return result;
}

module.exports = {
    gaMpAPICall: gaMpAPICall
};
