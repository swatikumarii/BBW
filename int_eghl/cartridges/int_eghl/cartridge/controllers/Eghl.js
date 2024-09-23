/**
 * @File Name          : Eghl.js
 * @Description        : Eghl.js is the default controller of eGHL cartridge
 * Ver       Modification Logs
 * 1.0 Handle the eGHL callback function
 **/

'use strict';

/**
 * @namespace Eghl
 */

var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var seo = require('*/cartridge/scripts/middleware/seo');

/**
 * Eghl-Callback : This endpoint is invoked when the eGHL call callback url
 * @name Base/Eghl-Callback
 * @function
 * @memberof Eghl
 * @param {querystringparameter} - ID - Order ID
 * @param {querystringparameter} - token - token associated with the order
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
server.post(
    'Callback',
    server.middleware.https,
    function (req, res, next) {
        var logger = require('dw/system/Logger').getLogger('eghl');
        var eghlHelper = require('*/cartridge/scripts/helpers/eghlHelper');
        var eghlApi = require('*/cartridge/scripts/service/eGHLApi');
        var eGHLPreference = require('*/cartridge/scripts/service/eGHLPreference');
        var eghlServiceCredentials = eghlApi.getServiceCredentials();
        var requestParameter = req.httpParameterMap;
        var requestOrderId = requestParameter.OrderNumber.value;
        var order = OrderMgr.getOrder(requestOrderId);
        if (order.status.value == Order.ORDER_STATUS_CREATED) {
            var authCode = 'AuthCode' in requestParameter && requestParameter.AuthCode.value && requestParameter.AuthCode.value != null ? requestParameter.AuthCode.value : '';
            var hashValue = requestParameter.HashValue.value;
            var hashvalue2 = requestParameter.HashValue2.value;
            var txnId = requestParameter.TxnID.value;
            var paymentId = requestParameter.PaymentID.value;
            var txnStatus = requestParameter.TxnStatus.value;
            var amount = requestParameter.Amount.value;
            var currencyCode = requestParameter.CurrencyCode.value;
            var orderNumber = requestParameter.OrderNumber.value;

            // request to generate hash value
            var hashValueRequest = eghlServiceCredentials.password + txnId + eghlServiceCredentials.user + paymentId + txnStatus + amount + currencyCode + authCode;

            // request to generate hash value2
            var hashValue2Request = eghlServiceCredentials.password + txnId + eghlServiceCredentials.user + paymentId + txnStatus + amount + currencyCode + authCode + orderNumber;

            // Get hash value from helper
            var generateHashValue = eghlHelper.generateResponseHashValue(hashValueRequest);
            var generateHashValue2 = eghlHelper.generateResponseHashValue(hashValue2Request);

            // Check if hash values are correct
            if (hashValue == generateHashValue && hashvalue2 == generateHashValue2) {
                // check txn status and update the order status accordingly
                var isEhlCallback = true;
                if (txnStatus == eGHLPreference.txnSuccessStatus) {
                    logger.error('EGHL:Successfull callback is called for order id {0}', orderNumber);
                    eghlHelper.placeOrder(order, isEhlCallback, server, req, res, next);
                } else if (txnStatus == eGHLPreference.txnFailedStatus) {
                    eghlHelper.failOrder(order, isEhlCallback, server, req, res, next);
                } else if (txnStatus == eGHLPreference.txnPendingStatus) {
                    eghlHelper.pendingOrder(order, isEhlCallback, server, req, res, next);
                }
            } else {
                logger.error('eGHL Callback: Unauthorized order access of order id {0} Hash value does not match', requestOrderId);
            }
        } else {
            logger.info('eGHL Callback: Requested order with order id {0} is not in created state', requestOrderId);
        }
        // TODO: Remove log after eGHL testing
        logger.info('eGHL callback was called successfully.');
        res.print('OK');
        next();
    },seo.addCurrentPageMetaData
);

module.exports = server.exports();

