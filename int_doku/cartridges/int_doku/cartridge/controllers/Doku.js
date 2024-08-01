/* eslint-disable global-require */
/* eslint-disable vars-on-top */
/**
 * @File Name          : Doku.js
 * @Description        : Doku.js is the default controller of Doku cartridge
 * Ver       Modification Logs
 * 1.0 Handle the Doku callback and notification function
 **/

'use strict';

/**
 * @namespace Doku
 */

var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var logger = require('dw/system/Logger').getLogger('doku');
var dokuHelper = require('*/cartridge/scripts/helpers/dokuHelper');
var dokuPreference = require('*/cartridge/scripts/service/dokuPreference');
var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
var dokuApi = require('*/cartridge/scripts/service/dokuApi');
var httpParameters = require('dw/svc/HTTPService');
var Resource = require('dw/web/Resource');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
/**
 * Doku-Notification : This endpoint is invoked when the Doku call Notification url
 * @name Base/Doku-Notification
 * @function
 * @memberof Doku
 * @param {querystringparameter} - ID - Order ID
 * @param {querystringparameter} - token - token associated with the order
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */

server.post('Notification', server.middleware.https, function (req, res, next) {
  var requestParameter = JSON.parse(req.body);
  var requestOrderId = requestParameter.order.invoice_number;
  var order = OrderMgr.getOrder(requestOrderId);
  var validRequestSignature = dokuHelper.verifySignature(req);
  var transactionStatus = requestParameter.transaction.status;
  var isDokuCallback = true;
  if (order.status.value === Order.ORDER_STATUS_CREATED) {
    // Check if Request Signature is valid
    if (validRequestSignature) {
    // check txn status and update the order status accordingly
      if (transactionStatus === dokuPreference.TransactionSuccess) {
        dokuHelper.placeOrder(order, isDokuCallback, requestParameter, server, req, res, next);
      } else if (transactionStatus === dokuPreference.TransactionPending) {
        dokuHelper.pendingOrder(order, isDokuCallback, requestParameter, server, req, res, next);
      } else if (transactionStatus === dokuPreference.TransactionFailed || transactionStatus === dokuPreference.TransactionExpired) {
        dokuHelper.failOrder(order, isDokuCallback, requestParameter, server, req, res, next);
      }
    } else {
      logger.error('Doku Notification: Unauthorized order access of order id {0} Request ID does not match', requestOrderId);
    }
  } else if (transactionStatus === dokuPreference.TransactionSuccess && order.status.value === Order.ORDER_STATUS_FAILED) {
    Transaction.wrap(function () {
      OrderMgr.undoFailOrder(order);
    });
    dokuHelper.placeOrder(order, isDokuCallback, requestParameter, server, req, res, next);
  } else {
    logger.info('Doku Notification: Requested order with order id {0} is not in created state', requestOrderId);
    return new Status(Status.ERROR, 'Invalid Signature', 400);
  }
  // TODO: Remove log after Doku testing
  logger.info('Doku Notification was called successfully.');
  return new Status(Status.OK);
  next();
});

/**
 * Doku-Callback : This endpoint is invoked when the Doku call Callback url
 * @name Base/Doku-Callback
 * @function
 * @memberof Doku
 * @param {querystringparameter} - ID - Order ID
 * @param {querystringparameter} - token - token associated with the order
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
server.get('Callback', server.middleware.https, function (req, res, next) {
  var queryData = req.querystring;
  var queryOrderId = queryData.order;
  var order = OrderMgr.getOrder(queryOrderId);
  var paymentStatusData = JSON.parse(dokuApi.getOrderPaymentStatus(queryOrderId).object);
  if (!order) {
    res.render('/error', {
      message: Resource.msg('error.confirmation.error', 'confirmation', null)
    });
    return next();
  }
  var paymentTransaction = order.paymentInstrument.getPaymentTransaction();
  if (!paymentStatusData) {
    paymentStatusData = JSON.parse(paymentTransaction.paymentInstrument.custom.dokuLog);
  }
  var transactionStatus = paymentStatusData.transaction.status;
  var result = { error: false, message: '' };
  if (order.status.value === Order.ORDER_STATUS_CREATED) {
    if (transactionStatus == 'SUCCESS') {
      dokuHelper.placeOrder(order, true, paymentStatusData, server, req, res, next);
    } else if (transactionStatus == 'PENDING') {
      dokuHelper.pendingOrder(order, true, paymentStatusData, server, req, res, next);
    } else if (transactionStatus == 'FAILED' || transactionStatus == 'EXPIRED' || transactionStatus == 'TIMEOUT') {
      dokuHelper.failOrder(order, true, paymentStatusData, server, req, res, next);
    }
  } else if (transactionStatus === dokuPreference.TransactionSuccess && order.status.value === Order.ORDER_STATUS_FAILED) {
    Transaction.wrap(function () {
      OrderMgr.undoFailOrder(order);
    });
    dokuHelper.placeOrder(order, true, paymentStatusData, server, req, res, next);
  }
  dokuHelper.renderCustomer(order, result, transactionStatus, server, req, res, next);
  next();
});

server.use('OVO', function (req, res, next) {
  var ovoApi = require('*/cartridge/scripts/service/ovoApi');
  var ovoHelper = require('*/cartridge/scripts/helpers/ovoHelper');
  var URLUtils = require('dw/web/URLUtils');
  var reqOrder = req.form;
  var ovoOrder = OrderMgr.getOrder(reqOrder.invoice_number);
  var ovoPayment = ovoApi.receiveOvoPayment(ovoOrder, reqOrder);
  var url;
  if (ovoPayment.error) {
    ovoHelper.failOrder(ovoOrder, ovoPayment, server, req, res);
    url = URLUtils.https('Doku-OVOThankYou', 'OrderID', reqOrder.invoice_number, 'Status', 'FAILED').toString();
    res.json({
      continue: url
    });
  } else {
    var validRes = ovoHelper.validateOvoRes(ovoPayment);
    var paymentStatusData = ovoPayment.ovo_payment.status;
    if (validRes) {
      if (!ovoOrder) {
        res.render('/error', {
          message: Resource.msg('error.confirmation.error', 'confirmation', null)
        });
        return next();
      }
      if (paymentStatusData === dokuPreference.TransactionSuccess && ovoPayment.ovo_payment.response_code === '00') {
        ovoHelper.placeOrder(ovoOrder, ovoPayment, server, req, res);
      } else {
        ovoHelper.failOrder(ovoOrder, ovoPayment, server, req, res);
      }
    }
    url = URLUtils.https('Doku-OVOThankYou', 'OrderID', reqOrder.invoice_number, 'Status', paymentStatusData).toString();
    res.json({
      continue: url
    });
  }
  next();
});

server.get('OVOThankYou', function (req, res, next) {
  var ovoHelper = require('*/cartridge/scripts/helpers/ovoHelper');
  var queryData = req.querystring;
  var queryOrderId = queryData.OrderID;
  var paymentStatusData = queryData.Status;
  var ovoOrder = OrderMgr.getOrder(queryOrderId);
  var result = { error: false, message: '' };
  dokuHelper.renderCustomer(ovoOrder, result, paymentStatusData, server, req, res, next);
  next();
});
module.exports = server.exports();
