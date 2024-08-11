/* eslint-disable vars-on-top */
'use strict';

var Status = require('dw/system/Status');
var Locale = require('dw/util/Locale');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var logger = require('dw/system/Logger').getLogger('eghl');
var Order = require('dw/order/Order');
var Resource = require('dw/web/Resource');
var MessageDigest = require('dw/crypto/MessageDigest');
var dokuHelper = require('*/cartridge/scripts/helpers/dokuHelper');
var dokuPreference = require('*/cartridge/scripts/service/dokuPreference');


/**
 * generateSecurityChecksum function is responsible to generate security checksum for OVO
 * @param  {string} amount amount string
 * @param  {string} clientId clientid string
 * @param  {string} invoiceNumber order id string
 * @param  {string} ovoID ovo id string
 * @param  {string} secretKey secret key string
 * @return {string} checkSumString for OVO
 */
function generateSecurityChecksum(amount, clientId, invoiceNumber, ovoID, secretKey) {
  var checkSumString = amount.toString() + clientId + invoiceNumber.toString() +
  ovoID.toString() + secretKey;
  var digestSHA256 = new MessageDigest(MessageDigest.DIGEST_SHA_256);
  return digestSHA256.digest(checkSumString);
}


/**
 * placeOrder function is responsible to update the order staus accoding to ovo and Doku txn status
 * @param  {Object} order order object
 * @param  {request} req  request object
 * @param  {response} res response object
 * @return {Object} place order response
 */
function placeOrder(order, ovoRes, server, req, res, next) {
  var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
  var qwikcilverApis = require('*/cartridge/scripts/service/qwikcilver/apis');
  var currentLocale;
  if ('locale' in req && req.locale.id) {
    currentLocale = Locale.getLocale(req.locale.id);
  } else {
    currentLocale = 'en_ID';
  }
  var result = { error: false, message: '' };
  var queryParam = ovoRes;
  var paymentTransaction = order.paymentInstrument.getPaymentTransaction();
  var transactionID = ovoRes.ovo_payment.reference_number;

  var isGiftProductAvailable = qwikcilverHelpers.validateGiftProduct(order);
  var giftCardAPIResult;
  var giftCardAPIRedeemResult;
  try {
    // Redeem Qwikcilver Gift Card
    if (order.getPaymentInstruments('GIFT_CERTIFICATE').length > 0) {
      giftCardAPIRedeemResult = qwikcilverApis.redeemGiftCards(order);

      if (giftCardAPIRedeemResult && giftCardAPIRedeemResult.status === 'OK' && giftCardAPIRedeemResult.object) {
        var redeemGiftCard = JSON.parse(giftCardAPIRedeemResult.object);
        if (redeemGiftCard.ResponseCode !== 0 && redeemGiftCard.Cards && redeemGiftCard.Cards.length > 0) {
          for (var i = 0; i < redeemGiftCard.Cards.length; i++) {
            result.error = true;
            result.message = redeemGiftCard.Cards[i].ResponseMessage;
          }
        }
      } else if (giftCardAPIRedeemResult && giftCardAPIRedeemResult.errorMessage) {
        if ('status' in giftCardAPIRedeemResult && giftCardAPIRedeemResult.getStatus().equals('SERVICE_UNAVAILABLE')) {
          result.error = true;
          result.message = Resource.msg('qwikcilver.service.unavailable', 'qwikcilver', null);
        } else if (giftCardAPIRedeemResult.msg !== 'Connection reset') {
          var redeemErrorMessageObj = JSON.parse(giftCardAPIRedeemResult.errorMessage);
          result.error = true;
          result.message = redeemErrorMessageObj.message;
        } else {
          result.error = true;
          result.message = Resource.msg('error.technical', 'checkout', null);
        }
      }
    }

    Transaction.begin();
    var placeOrderStatus = OrderMgr.placeOrder(order);
    if (placeOrderStatus === Status.ERROR) {
      throw new Error();
    }
    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
    order.setExportStatus(Order.EXPORT_STATUS_READY);
    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
    paymentTransaction.paymentInstrument.paymentTransaction.transactionID = transactionID;
    order.custom.dokuPaymentMethod = 'OVO';
    order.custom.dokutransactionID = transactionID;
    paymentTransaction.paymentInstrument.custom.dokuLog = JSON.stringify(queryParam);
    Transaction.commit();

      // Handles Gift payment authorization
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
    if (handlePaymentResult.error) {
      result.error = true;
      result.message = Resource.msg('error.technical', 'checkout', null);
    }

    if (giftCardAPIRedeemResult) {
      var redeemedGiftCard = JSON.parse(giftCardAPIRedeemResult.object);
      if (redeemedGiftCard.ResponseCode === 0) {
        qwikcilverHelpers.saveGiftCardDetails(order, redeemedGiftCard, 'Redeemed');
      }
    }

    // Send GiftCard Email
    var log = dw.system.Logger.getLogger('QwikcilverService');
    if (isGiftProductAvailable) {
      for (var index = 0; index < order.productLineItems.length; index++) {
            // Create GiftCard
        giftCardAPIResult = qwikcilverApis.createGiftCards(order, index);
        if (giftCardAPIResult && giftCardAPIResult.errorMessage) {
          if ('status' in giftCardAPIResult && giftCardAPIResult.getStatus().equals('SERVICE_UNAVAILABLE')) {
            result.error = true;
            result.message = Resource.msg('qwikcilver.service.unavailable', 'qwikcilver', null);
          } else if (giftCardAPIResult.msg !== 'Connection reset') {
            var errorMessageObj = JSON.parse(giftCardAPIResult.errorMessage);
            result.error = true;
            result.message = errorMessageObj.message;
          } else {
            result.error = true;
            result.message = Resource.msg('error.technical', 'checkout', null);
          }
        }
        if (giftCardAPIResult && giftCardAPIResult.status === 'OK' && giftCardAPIResult.object) {
          var giftCard = JSON.parse(giftCardAPIResult.object);
          if (giftCard.ResponseCode === 0) {
            qwikcilverHelpers.saveGiftCardDetails(order, giftCard, 'Created', index);
            qwikcilverHelpers.sendGiftCardEmail(order, currentLocale, false, true, index);
          } else {
            qwikcilverHelpers.sendGiftCardEmail(order, currentLocale, false, false, index);
            log.info('Error while Creating a Gift Card for OrderNo: {0}', order.orderNo);
            log.info('Gift Card Email is Not Sent to the Customer for OrderID: {0} for item number {1}', order.orderNo, index);
            if (index === order.productLineItems.length - 1) {
              dokuHelper.renderCustomer(order, result, 'CardIssueFailed', server, req, res, next);
            }
            return;
          }
        } else if (!giftCardAPIResult && !giftCardAPIRedeemResult && isGiftProductAvailable) {
          qwikcilverHelpers.sendGiftCardEmail(order, currentLocale, false, false, index);
          log.info('Error while Creating a Gift Card for OrderNo: {0}', order.orderNo);
          log.info('Gift Card Email is Not Sent to the Customer for OrderID: {0} for item number {1}', order.orderNo, index);
          dokuHelper.renderCustomer(order, result, 'CardIssueFailed', server, req, res, next);
          return;
        }
      }
    }
    if (order.getCustomerEmail()) {
      COHelpers.sendConfirmationEmail(order, currentLocale);
    }
  } catch (e) {
    Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
    logger.error('Error while placing the order. Error response is' + e);
    result.error = true;
    result.message = Resource.msg('common.error.msg', 'eghl', null);
  }
}

  /**
   * failOrder function is responsible to update the order status to fail
   * @param  {Object} order Order object
   * @param  {Request} req Request Object
   * @param  {Response} res Response Object
   * @param  {} next
   */
function failOrder(order, ovoRes, server, req, res, next) {
  var result = { error: false, message: '' };
  var queryParam = ovoRes;
  var paymentTransaction = order.paymentInstrument.getPaymentTransaction();
  try {
    Transaction.begin();
    var failOrderStatus = OrderMgr.failOrder(order, true);
    if (failOrderStatus === Status.ERROR) {
      throw new Error();
    }
    order.custom.dokuPaymentMethod = 'OVO';
    paymentTransaction.paymentInstrument.custom.dokuLog = JSON.stringify(queryParam);
    Transaction.commit();

          // Trigger order place email to user
    if (order.getCustomerEmail()) {
      var locale = req.locale.id ? req.locale.id : 'en_ID';
      COHelpers.sendFailOrderEmail(order, locale);
    }
  } catch (e) {
    logger.error('Error while updating the order staus to Fail' + e);
    result.error = true;
    result.message = Resource.msg('common.error.msg', 'eghl', null);
  }
}

  /**
   * validateOvoRes function is responsible to validate the OVO response
   * @param  {Object}  ovoPayment object
   * @return {boolean} valid Response or Not
   */

function validateOvoRes(ovoPayment) {
  var merchantId = dokuPreference.merchantId;
  var storeCode = dokuPreference.storeCode;
  var mid = dokuPreference.mid;
  var tid = dokuPreference.tid;
  if (ovoPayment.ovo_configuration.merchant_id === merchantId && ovoPayment.ovo_configuration.store_code === storeCode && ovoPayment.ovo_configuration.mid === mid && ovoPayment.ovo_configuration.tid === tid) {
    return true;
  }
  return false;
}
module.exports = {
  generateSecurityChecksum: generateSecurityChecksum,
  validateOvoRes: validateOvoRes,
  failOrder: failOrder,
  placeOrder: placeOrder
};
