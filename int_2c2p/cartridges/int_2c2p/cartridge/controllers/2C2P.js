/* eslint-disable vars-on-top */

/**
 * @File Name:  2c2p.js
 * @Description: 2c2p.js Controller file handles callback and notification from 2c2p payment gateway
 * @Author   : Bhupender Pareek
 * Ver 1.0
 **/


 'use strict';

 /**
  * @namespace 2c2p
  */

 var server = require('server');
 var OrderMgr = require('dw/order/OrderMgr');
 var Order = require('dw/order/Order');
 var Resource = require('dw/web/Resource');
 var _2c2pAPI = require('*/cartridge/scripts/service/2c2pAPI');
 var _2c2pPreferences = require('*/cartridge/scripts/service/2c2pPreferences');
 var _2c2pHelper = require('*/cartridge/scripts/helpers/2c2pHelper');
 var Status = require('dw/system/Status');
 var _2c2pService = require('*/cartridge/scripts/service/init/2c2pService');
 var Site = require('dw/system/Site');
 var Transaction = require('dw/system/Transaction');
 var logger = require('dw/system/Logger').getLogger('2c2p');

 /**
  * 2c2p-Notification : This endpoint is invoked when the 2c2p call Notification url
  * @name Base/2c2p-Notification
  * @function
  * @memberof 2c2p
  * @param {serverfunction} - use
  */
 server.use('Notification', server.middleware.https, function (req, res, next) {
   var requestParameter = req.body;
   var decryptedJSON;
   var paymentStatus = {};
   var paymentChannel;
  //  logger.info('2c2p Request Parameters in Notifications are {0} and 2c2pPreferences.2c2pEncrypt is {1}', requestParameter, _2c2pPreferences._2c2pEncrypt);
   if (_2c2pPreferences._2c2pEncrypt) {
    decryptedJSON = _2c2pService.decryptRequest(requestParameter);
     paymentStatus.response = JSON.parse(decryptedJSON);
     var orderID = paymentStatus.response.transaction.txnRef;
     var order = OrderMgr.getOrder(orderID);

     if (paymentStatus.response.error || !order) {
       res.render('/error', {
         message: Resource.msg('error.confirmation.error', 'confirmation', null)
       });
       return next();
     }
     if ('online_cc' in paymentStatus.response) {
       paymentChannel = 'online_cc';
     } else if ('offline' in paymentStatus.response) {
       paymentChannel = 'offline';
     } else if ('ipp' in paymentStatus.response) {
       paymentChannel = 'ipp';
     } else if ('offline' in paymentStatus.response) {
       paymentChannel = 'offline';
     } else {
       paymentChannel = '2c2p';
     }
     if (order.status.value === Order.ORDER_STATUS_CREATED) {
       if (Site.getCurrent().ID.includes('rituals')) {
         var paymentType = '';
         if (order.getPaymentInstruments('GIFT_CERTIFICATE').length > 0) {
           paymentType = 'Giftcard and ';
         }
         if (paymentChannel === 'online_cc') {
           paymentType += 'Credit Card';
         } else {
           paymentType += paymentChannel;
         }
         Transaction.wrap(function () {
           order.custom.paymentType = paymentType;
         });
       }
       if (paymentStatus.response.payment.channel_response_code === '00' || paymentStatus.response.payment.channel_response_code === '000') {
         _2c2pHelper.placeOrder(order, true, paymentStatus, paymentChannel, server, req, res, next);
       } else {
         _2c2pHelper.failOrder(order, true, paymentStatus, paymentChannel, server, req, res, next);
       }
     }  else if ((paymentStatus.response.payment.channel_response_code === '00' || paymentStatus.response.payment.channel_response_code === '000') && order.status.value === Order.ORDER_STATUS_FAILED) {
          Transaction.wrap(function () {
          OrderMgr.undoFailOrder(order);
          });
          dokuHelper.placeOrder(order, true, paymentStatus, paymentChannel, server, req, res, next);
     }
   }
   return new Status(Status.OK);
 });

  /**
   * 2c2p-Callback : This endpoint is invoked when the 2c2p call Callback url
   * @name Base/2c2p-Callback
   * @function
   * @memberof 2c2p
   * @param {serverfunction} - get
   */
 server.use('Callback', server.middleware.https, function (req, res, next) {
   var queryData = req.querystring;
   var queryOrderId = queryData.order;
   var order = OrderMgr.getOrder(queryOrderId);
   var paymentStatus = _2c2pAPI.getPaymentStatus(queryOrderId);
   var paymentChannel;
   logger.info('Query Data id {3} Order Id is {0} and payment status is {1} and order is {2}', queryOrderId, JSON.stringify(paymentStatus), order, JSON.stringify(queryData));
   if (paymentStatus.error || !order) {
     res.render('/error', {
       message: Resource.msg('error.confirmation.error', 'confirmation', null)
     });
     return next();
   }
   if ('online_cc' in paymentStatus.response) {
     paymentChannel = 'online_cc';
   } else if ('offline' in paymentStatus.response) {
     paymentChannel = 'offline';
   } else if ('ipp' in paymentStatus.response) {
     paymentChannel = 'ipp';
   } else if ('offline' in paymentStatus.response) {
     paymentChannel = 'offline';
   } else {
     paymentChannel = '2c2p';
   }
   var transactionStatus = paymentStatus.response.transaction.txnStatus ? paymentStatus.response.transaction.txnStatus.toUpperCase() : false;
   var result = { error: false, message: '' };
   if (order.status.value === Order.ORDER_STATUS_CREATED && transactionStatus) {
     if (Site.getCurrent().ID.includes('rituals')) {
       var paymentType = '';
       if (order.getPaymentInstruments('GIFT_CERTIFICATE').length > 0) {
         paymentType = 'Giftcard and ';
       }
       if (paymentChannel === 'online_cc') {
         paymentType += 'Credit Card';
       } else {
         paymentType += paymentChannel;
       }
       Transaction.wrap(function () {
        order.custom.paymentType = paymentType;
       });
     }
     if (transactionStatus == _2c2pPreferences.TransactionSuccess) {
       _2c2pHelper.placeOrder(order, true, paymentStatus, paymentChannel, server, req, res, next);
     } else if (transactionStatus == _2c2pPreferences.TransactionPending) {
       _2c2pHelper.pendingOrder(order, true, paymentStatus, paymentChannel, server, req, res, next);
     } else if (transactionStatus == _2c2pPreferences.TransactionFailed || transactionStatus == _2c2pPreferences.TransactionExpired || transactionStatus == _2c2pPreferences.TransactionExpired || transactionStatus == _2c2pPreferences.TransactionVoided) {
       _2c2pHelper.failOrder(order, true, paymentStatus, paymentChannel, server, req, res, next);
     }
   } else if (!transactionStatus) {
     if (order.status.value === Order.ORDER_STATUS_NEW || order.status.value === Order.ORDER_STATUS_OPEN || order.status.value === Order.ORDER_STATUS_COMPLETED) {
       transactionStatus = _2c2pPreferences.TransactionSuccess;
     } else {
       transactionStatus = _2c2pPreferences.TransactionFailed;
     }
   }
   _2c2pHelper.renderCustomer(order, result, transactionStatus, server, req, res, next);
   next();
 });


 module.exports = server.exports();
