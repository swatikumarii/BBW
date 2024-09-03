/* eslint-disable global-require */
/* eslint-disable vars-on-top */
'use strict';

var dokuPreference = require('*/cartridge/scripts/service/dokuPreference');
var Status = require('dw/system/Status');
var Locale = require('dw/util/Locale');
var OrderModel = require('*/cartridge/models/order');
var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var logger = require('dw/system/Logger').getLogger('eghl');
var Order = require('dw/order/Order');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var MessageDigest = require('dw/crypto/MessageDigest');
var Mac = require('dw/crypto/Mac');
var Encoding = require('dw/crypto/Encoding');
var co = require('dw/object/CustomObjectMgr');
var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
var collections = require('*/cartridge/scripts/util/collections');

 /**
   * createRequestBody function is responsible to generate the Request Body For Payment URL Request
   * @param  {Object} order Order
   * @param  {Object} paymentForm paymentForm Filled during checkout
   * @return {string} stringified request
   */
function createRequestBody(order, basket, paymentForm) {
  var lineItems = [];
  var count;
  var amount;
  for (var instrumentcount = 0; instrumentcount < basket.paymentInstruments.length; instrumentcount++) {
    if (basket.paymentInstruments[instrumentcount].paymentMethod === 'Doku') {
      amount = basket.paymentInstruments[instrumentcount].paymentTransaction.amount.value;
    }
  }
  var itemCount = order.allProductLineItems.length;
  for (count = 0; count < itemCount; count++) {
    lineItems.push({
      name: order.allProductLineItems[count].productName,
      price: order.allProductLineItems[count].basePrice.value,
      quantity: order.allProductLineItems[count].quantityValue,
      sku: order.allProductLineItems[count].productID
    });
  }
  var shipmentCount = order.shipments.length;
  for (count = 0; count < shipmentCount; count++) {
    lineItems.push({
      name: order.shipments[count].shippingMethod.displayName,
      price: order.shipments[count].shippingTotalPrice.value,
      quantity: 1,
      sku: order.shipments[count].shippingMethod.ID
    });
  }
  var payment = {
    payment_due_date: dokuPreference.paymentDueDate
  };
  var paymentMethodTypes = dokuPreference.dokuPaymentMethods;
  if (paymentMethodTypes) {
    payment.payment_method_types = paymentMethodTypes.split(',');
  }
  var callbackUrl = URLUtils.abs(dokuPreference.merchantReturnUrl, 'order', order.currentOrderNo).toString();
  var requestJSON = {
    order: {
      amount: amount ? amount : Math.floor(basket.totalGrossPrice.value),
      invoice_number: order.currentOrderNo,
      currency: order.currencyCode,
      callback_url: callbackUrl
    },
    payment: payment,
    customer: {
      name: paymentForm.addressFields.firstName.value + ' ' + paymentForm.addressFields.lastName.value,
      email: paymentForm.contactInfoFields.email.htmlValue,
      phone: paymentForm.contactInfoFields.phone.htmlValue,
      address: paymentForm.addressFields.address1.value + ' ' + paymentForm.addressFields.address2.value + ' ' + paymentForm.addressFields.city.value + ' ' + paymentForm.addressFields.postalCode.value,
      country: paymentForm.addressFields.country.value
    }
  };

  return JSON.stringify(requestJSON);
}

  /**
   * generateDigest function is responsible to generate the SHA256 encrypted string
   * @param  {Object} jsonBody Request Body
   * @return {string} encoded string
   */
function generateDigest(jsonBody) {
  var digestSHA256 = new MessageDigest(MessageDigest.DIGEST_SHA_256);
  return Encoding.toBase64(Encoding.fromHex(digestSHA256.digest(jsonBody)));
}

  /**
   * generateSignature function is responsible to generate the Signature for Request Header
   * @param {string} clientId string
   * @param {string} requetsID string
   * @param {string} requestTimestamp string
   * @param {string} digest encoded string
   * @param {string} secret string
   * @return {string} encoded string
   */
function generateSignature(clientId, requestId, requestTimestamp, requestTarget, digest, secret) {
  var componentSignature = 'Client-Id:' + clientId + '\n';
  componentSignature += 'Request-Id:' + requestId;
  componentSignature += '\n';
  componentSignature += 'Request-Timestamp:' + requestTimestamp;
  componentSignature += '\n';
  componentSignature += 'Request-Target:' + requestTarget;
  if (digest) {
    componentSignature += '\n';
    componentSignature += 'Digest:' + digest;
  }
  var digestHMACSHA256 = new Mac(Mac.HMAC_SHA_256);
  var hmac256Value = Encoding.toHex(digestHMACSHA256.digest(componentSignature, secret));
  var signature = Encoding.toBase64(Encoding.fromHex(hmac256Value));
  return 'HMACSHA256=' + signature;
}

/**
   * verifySignature function is responsible to verify the Signature for notification Request
   * @param {object} req object
   * @return {boolean} result of verification
   */

function verifySignature(req) {
  var incomingSignature = req.httpHeaders.get('signature');
  var requestTimestamp = req.httpHeaders.get('request-timestamp');
  var requestId = req.httpHeaders.get('request-id');
  var requestTarget = req.path;
  var digest = generateDigest(req.body);
  var clientId = dokuPreference.client_id;
  var secret = dokuPreference.secretKey;
  var signature = generateSignature(clientId, requestId, requestTimestamp, requestTarget, digest, secret);
  if (signature === incomingSignature) {
    return true;
  }
  return false;
}

/**
 * renderCustomer function is responsible to render the customer on order success page
 * @param  {Object} order Order object
 * @param  {Object} result Place order object
 * @param  {request} req current request
 * @param  {response} res Response to customer
 */
function renderCustomer(order, result, orderStatus, server, req, res, next) {
  var config = {
    numberOfLineItems: '*'
  };

  var currentLocale;
  if ('locale' in req && req.locale.id) {
    currentLocale = Locale.getLocale(req.locale.id);
  }

  var orderModel = new OrderModel(
        order,
        { config: config, countryCode: currentLocale.country, containerView: 'order' }
    );
  var passwordForm;

  var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);
  var viewData = res.getViewData();
  viewData.isThankYouPage = true;

  // prepare transactional data for GTM
  var orderData = orderModel;
  var orderStatusValue = orderData.orderStatus.value;
  if (orderStatusValue == Order.ORDER_STATUS_FAILED) {
      var paymentMethod = [];
      collections.forEach(order.paymentInstruments, function (paymentMethods) {
        paymentMethod.push(paymentMethods.paymentMethod);
      });
  }
  res.setViewData(viewData);
  var responseObject
  if (!req.currentCustomer.profile) {
    passwordForm = server.forms.getForm('newPasswords');
    passwordForm.clear();
    responseObject = {
      order: orderModel,
      returningCustomer: false,
      passwordForm: passwordForm,
      reportingURLs: reportingURLs,
      orderUUID: order.getUUID(),
      orderStatus: orderStatus,
      orderStatusVal: Order

    }
    if (orderStatus === 'PENDING') {
      res.render('checkout/pendingOrder', responseObject);
    } else {
      res.render('checkout/confirmation/confirmation', responseObject);
    }
  } else {
    responseObject = {
      order: orderModel,
      returningCustomer: true,
      reportingURLs: reportingURLs,
      orderUUID: order.getUUID(),
      orderStatus: orderStatus,
      orderStatusVal: Order
    }
    if (orderStatus === 'PENDING') {
      res.render('checkout/pendingOrder', responseObject);
    } else {
      res.render('checkout/confirmation/confirmation', responseObject);
    }
  }
  req.session.raw.custom.orderID = req.querystring.ID; // eslint-disable-line no-param-reassign
}


/**
 * placeOrder function is responsible to update the order staus accoding to eGHL txn status
 * @param  {Object} order order object
 * @param  {request} req  request object
 * @param  {response} res response object
 * @return {Object} place order response
 */
function placeOrder(order, isDokuCallback, dokuRes, server, req, res, next) {
  var currentLocale;
  if ('locale' in req && req.locale.id) {
    currentLocale = Locale.getLocale(req.locale.id);
  } else {
    currentLocale = 'en_ID';
  }
  var result = { error: false, message: '' };
  var queryParam = dokuRes;
  var paymentTransaction = order.paymentInstrument.getPaymentTransaction();
  var paymentService = queryParam.service.id;
  var transactionID = '';
  var transaction;
  if (paymentService === 'CREDIT_CARD') {
    transactionID = queryParam.order.invoice_number;
  } else if (paymentService === 'ONLINE_TO_OFFLINE') {
    transaction = queryParam.online_to_offline_payment.identifier.filter(function (e) {
      return e.name === 'AGENT_TRX_ID';
    });
    transactionID = transaction[0].value;
  } else if (paymentService === 'VIRTUAL_ACCOUNT') {
    transaction = queryParam.virtual_account_payment.identifier.filter(function (e) {
      return e.name === 'TRANSAKSI_ID' || e.name === 'TRANSACTION_ID' || e.name === 'REFERENCE' || e.name === 'BANK_REFERENCE' || e.name === 'TRANSACTION_NUMBER' || e.name === 'TRX_ID' || e.name === 'USER_REF_NO' || e.name === 'TRACE_NUMBER' || e.name === 'VI_TRACENO';
    });
    transactionID = transaction[0].value;
  }

  var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
  var isGiftProductAvailable = qwikcilverHelpers.validateGiftProduct(order);
  var qwikcilverApis = require('*/cartridge/scripts/service/qwikcilver/apis');
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
    var dokuRequestID = queryParam.transaction.original_request_id;
    order.custom.dokuPaymentMethod = queryParam.channel.id;
    order.custom.dokuRequestId = dokuRequestID;
    order.custom.dokutransactionID = transactionID;
    var checkDokuPendingStatus = co.getCustomObject('dokuPendingStatus', dokuRequestID);
    if (checkDokuPendingStatus) {
      co.remove(checkDokuPendingStatus);
    }
    if (paymentTransaction.paymentInstrument.custom.dokuLog) {
      var prevLog = paymentTransaction.paymentInstrument.custom.dokuLog;
      paymentTransaction.paymentInstrument.custom.dokuLog = prevLog + ',' + JSON.stringify(queryParam);
    } else {
      paymentTransaction.paymentInstrument.custom.dokuLog = JSON.stringify(queryParam);
    }
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
              renderCustomer(order, result, 'CardIssueFailed', server, req, res, next);
            }
            return;
          }
        } else if (!giftCardAPIResult && !giftCardAPIRedeemResult && isGiftProductAvailable) {
          qwikcilverHelpers.sendGiftCardEmail(order, currentLocale, false, false, index);
          log.info('Error while Creating a Gift Card for OrderNo: {0}', order.orderNo);
          log.info('Gift Card Email is Not Sent to the Customer for OrderID: {0} for item number {1}', order.orderNo, index);
          renderCustomer(order, result, 'CardIssueFailed', server, req, res, next);
          return;
        }
      }
    }
    if (order.getCustomerEmail()) {
      COHelpers.sendConfirmationEmail(order, currentLocale);
    }

    if (!isDokuCallback) {
      var orderStatus = queryParam.TxnStatus.value;
      renderCustomer(order, result, orderStatus, server, req, res, next);
    }
  } catch (e) {
    Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
    logger.error('Error while placing the order. Error response is' + e);
    result.error = true;
    result.message = Resource.msg('common.error.msg', 'eghl', null);
  }
}

/**
 * pendingOrder function is responsible to update the order status to pending
 * @param  {Object} order Order object
 * @param  {Boolean} isEhlCallback dokuCallback flag
 * @param  {Object} req Request data
 * @param  {Object} res Response Data
 * @param  {} next pointer
 */
function pendingOrder(order, isDokuCallback, dokuRes, server, req, res, next) {
  var result = { error: false, message: '' };
  var queryParam = dokuRes;
  var paymentTransaction = order.paymentInstrument.getPaymentTransaction();
  try {
    Transaction.begin();
    order.custom.dokuPaymentMethod = queryParam.channel.id;
    var dokuRequestID = queryParam.transaction.original_request_id;
    order.custom.dokuRequestId = dokuRequestID;
    paymentTransaction.paymentInstrument.custom.dokuLog = JSON.stringify(queryParam);

    var checkDokuPendingStatus = co.getCustomObject('dokuPendingStatus', dokuRequestID);
    if (checkDokuPendingStatus) {
      checkDokuPendingStatus.custom.dokuLog = JSON.stringify(queryParam);
    } else {
      var createDokuPendingStatus = co.createCustomObject('dokuPendingStatus', dokuRequestID);
      createDokuPendingStatus.custom.dokuLog = JSON.stringify(queryParam);
    }

    Transaction.commit();
  } catch (e) {
    logger.error('Error while updating the pending payment data' + e);
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
function failOrder(order, isDokuCallback, dokuRes, server, req, res, next) {
  var result = { error: false, message: '' };
  var queryParam = dokuRes;
  var paymentTransaction = order.paymentInstrument.getPaymentTransaction();
  try {
    Transaction.begin();
    var failOrderStatus = OrderMgr.failOrder(order, true);
    if (failOrderStatus === Status.ERROR) {
      throw new Error();
    }
    order.custom.dokuPaymentMethod = queryParam.channel.id;
    var dokuRequestID = queryParam.transaction.original_request_id;
    var checkDokuPendingStatus = co.getCustomObject('dokuPendingStatus', dokuRequestID);
    order.custom.dokuRequestId = dokuRequestID;
    paymentTransaction.paymentInstrument.custom.dokuLog = JSON.stringify(queryParam);
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
    if (handlePaymentResult.error) {
      result.error = true;
      result.message = Resource.msg('error.technical', 'checkout', null);
    }
    if (checkDokuPendingStatus) {
      co.remove(checkDokuPendingStatus);
    }
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

module.exports = {
  generateDigest: generateDigest,
  generateSignature: generateSignature,
  verifySignature: verifySignature,
  createRequestBody: createRequestBody,
  renderCustomer: renderCustomer,
  pendingOrder: pendingOrder,
  failOrder: failOrder,
  placeOrder: placeOrder
};
