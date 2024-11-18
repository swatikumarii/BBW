/* eslint-disable vars-on-top */
/* eslint-disable global-require */
'use strict';
var _2c2pAPI = require('*/cartridge/scripts/service/2c2pAPI');
var _2c2pPreferences = require('*/cartridge/scripts/service/2c2pPreferences');
var Encoding = require('dw/crypto/Encoding');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Resource = require('dw/web/Resource');
var Status = require('dw/system/Status');
var Locale = require('dw/util/Locale');
var OrderModel = require('*/cartridge/models/order');
var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var co = require('dw/object/CustomObjectMgr');
var URLUtils = require('dw/web/URLUtils');
var logger = require('dw/system/Logger').getLogger('2c2p');
var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
var collections = require('*/cartridge/scripts/util/collections');
var Site = require('dw/system/Site');

function getAddress(address) {
  return address.address1 + ' ' + address.address2 + ' ' + address.city  + ' ' + address.stateCode + ' ' + address.postalCode;
}

function getItems(productLineItems) {
  var items = collections.map(productLineItems, function (productLineItem) {
    return {
      reference: '',
      total_unit_amount: productLineItem.adjustedGrossPrice.value,
      no_of_unit: productLineItem.quantityValue,
      name: productLineItem.lineItemText,
      tax: productLineItem.adjustedTax.value,
      unit_amount: productLineItem.basePrice.value
    }
  })
  return items;
}

/**
 * createRequestBody function is responsible to generate the Request Body For Payment URL Request
 * @param  {Object} order Order
 * @param  {Object} basket basket
 * @param  {Object} paymentForm paymentForm Filled during checkout
 * @return {string} stringified request
 */
function createRequestBody(order, basket, paymentForm, req, payoo) {
  var transaction = {};
  var system = {};
  var payment = {};
  var merchant = {};
  var customer = {};
  var reqOrder = {};
  var reqBody;
  var amount;
  var instrumentcount;
  for (instrumentcount = 0; instrumentcount < basket.paymentInstruments.length;
     instrumentcount++) {
    if (basket.paymentInstruments[instrumentcount].paymentMethod === '2c2p') {
      amount = basket.paymentInstruments[instrumentcount].paymentTransaction.amount.value;
    }
  }
  transaction.txnRef = order.orderNo.toString();
  system.default_lang = req.locale.id.substring(0, 2);
  system.redirectUrl = URLUtils.abs(_2c2pPreferences.hsbcMerchantCallBackUrl, 'order', order.currentOrderNo).toString();
  system.notifyUrl = _2c2pPreferences.hsbcMerchantNotificationUrl.toString();
  payment.country = req.locale.id.substring(3);
  payment.currency = req.session.currency.currencyCode;
  if (amount) {
    payment.amount = Math.round(parseFloat(amount * 100, 10));
  } else {
    payment.amount = Math.round(parseFloat(basket.totalGrossPrice.value * 100, 10));
  }
  merchant.merId = _2c2pPreferences.hsbcMerchantID;
  customer.email = paymentForm.contactInfoFields.email.htmlValue;
  reqOrder.description = 'Payment For BBW Order no.' + order.orderNo;
  if (payoo) {
    var url_setting = {
      webhook: _2c2pPreferences.hsbcMerchantNotificationUrl.toString(),
      return_page: URLUtils.abs(_2c2pPreferences.hsbcMerchantCallBackUrl, 'order', order.currentOrderNo).toString()
    }
    var page_setting = {
      payment_option: ['card','installment','wallet'],
      expiry: parseInt((Date.now() + 86400) / 1000, 10)
    }
    var customer = {
      address: getAddress(basket.defaultShipment.shippingAddress),
      phone: paymentForm.contactInfoFields.phone.htmlValue,
      last_name: basket.defaultShipment.shippingAddress.lastName,
      first_name: basket.defaultShipment.shippingAddress.firstName,
      email: paymentForm.contactInfoFields.email.htmlValue
    }
    var checkout_model = {
      vn_py_hosted_checkout : {
        url_setting: url_setting,
        page_setting: page_setting,
        customer: customer
      }
    }
    reqBody = {
      amount: payment.amount,
      checkout_model: checkout_model,
      description: 'Payment For BBW Order no' + order.orderNo.toString(),
      currency: Site.getCurrent().currencyCode.toLowerCase(),
      id: order.orderNo.toString(),
      items: getItems(basket.allProductLineItems)
    }
  } else {
    reqBody = {
      transaction: transaction,
      system: system,
      payment: payment,
      merchant: merchant,
      customer: customer,
      order: reqOrder
    };
  }

  return reqBody;
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
  res.setViewData(viewData);
  var Site = require('dw/system/Site');
  var currentSite = Site.getCurrent();
  if (order.status.value === Order.ORDER_STATUS_FAILED &&
    currentSite && currentSite.ID.toLowerCase().indexOf('rituals') !== -1) {
    if ('custom' in order && 'isEgiftOrder' in order.custom && order.custom.isEgiftOrder) {
      res.redirect(URLUtils.url('Cart-Show', 'showGiftcardCart', 'true', 'error', Resource.msg('msg.failed.order.thank.you', 'confirmation', null), 'order', order.orderNo));
    } else {
      res.redirect(URLUtils.url('Cart-Show', 'error', Resource.msg('msg.failed.order.thank.you', 'confirmation', null), 'order', order.orderNo));
    }
  } else {
      var logObject = {
        order: orderModel,
        returningCustomer: false,
        reportingURLs: reportingURLs,
        orderUUID: order.getUUID(),
        orderStatus: orderStatus,
        result: result
      };
      var viewDataLogger = require('dw/system/Logger').getLogger('2c2p');
      viewDataLogger.info('2c2p Confirmation viewdata: {0}', JSON.stringify(logObject));
      if (!req.currentCustomer.profile) {
        passwordForm = server.forms.getForm('newPasswords');
        passwordForm.clear();
        res.render('checkout/confirmation/confirmation', {
          order: orderModel,
          returningCustomer: false,
          passwordForm: passwordForm,
          reportingURLs: reportingURLs,
          orderUUID: order.getUUID(),
          orderStatus: orderStatus,
          result: result,
          orderStatusVal: Order
        });
      } else {
        res.render('checkout/confirmation/confirmation', {
          order: orderModel,
          returningCustomer: true,
          reportingURLs: reportingURLs,
          orderUUID: order.getUUID(),
          orderStatus: orderStatus,
          result: result,
          orderStatusVal: Order
        });
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
function placeOrder(order, is2c2pCallback, _2c2pRes, paymentChannel, server, req, res, next) {
  var currentLocale;
  if ('locale' in req && req.locale.id) {
    currentLocale = Locale.getLocale(req.locale.id);
  } else {
    currentLocale = 'en_TH';
  }
  var result = { error: false, message: '' };
  var queryParam = _2c2pRes;
  var paymentTransaction = order.paymentInstrument.getPaymentTransaction();
  var transactionID = '';

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
    paymentTransaction.paymentInstrument.paymentTransaction.transactionID ='response' in _2c2pRes ? _2c2pRes.response.transaction.txnRef : '';
    order.custom['2c2pPaymentMethod'] = paymentChannel;
    order.custom['2c2ptransactionID']= 'response' in _2c2pRes ? _2c2pRes.response.transaction.txnRef : '';
    if('response' in _2c2pRes) {
      var check2c2pPendingStatus = co.getCustomObject('2c2pPendingStatus', _2c2pRes.response.transaction.txnRef);
      if (check2c2pPendingStatus) {
        co.remove(check2c2pPendingStatus);
      }
    }
    paymentTransaction.paymentInstrument.custom['2c2pLog'] = JSON.stringify(queryParam);
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

    if (!is2c2pCallback) {
      var orderStatus = queryParam.response.transaction.txnStatus.toUpperCase();
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
   * @param  {Object} 2c2pRes 2c2p response object
   * @param  {Object} req Request data
   * @param  {Object} res Response Data
   * @param  {} next pointer
   */
function pendingOrder(order, is2c2pCallback, _2c2pRes, paymentChannel, server, req, res, next) {
  var result = { error: false, message: '' };
  var queryParam = _2c2pRes;
  var paymentTransaction = order.paymentInstrument.getPaymentTransaction();
  try {
    Transaction.begin();
    order.custom['2c2pPaymentMethod'] = paymentChannel;
    paymentTransaction.paymentInstrument.custom['2c2pLog'] = JSON.stringify(queryParam);

    var check2c2pPendingStatus = co.getCustomObject('2c2pPendingStatus', _2c2pRes.response.transaction.txnRef);
    if (check2c2pPendingStatus) {
      check2c2pPendingStatus.custom['2c2pLog'] = JSON.stringify(queryParam);
    } else {
      check2c2pPendingStatus = co.createCustomObject('2c2pPendingStatus', _2c2pRes.response.transaction.txnRef);
      check2c2pPendingStatus.custom['2c2pLog'] = JSON.stringify(queryParam);
    }

    Transaction.commit();
  } catch (e) {
    logger.error('Error while updating the pending payment data' + e);
    result.error = true;
    result.message = Resource.msg('common.error.msg', 'confirmation', null);
  }
}
  /**
   * failOrder function is responsible to update the order status to fail
   * @param  {Object} order Order object
   * @param  {Request} req Request Object
   * @param  {Response} res Response Object
   * @param  {} next
   */
function failOrder(order, is2c2pCallback, _2c2pRes, paymentChannel, server, req, res, next) {
  var result = { error: false, message: '' };
  var queryParam = _2c2pRes;
  var paymentTransaction = order.paymentInstrument.getPaymentTransaction();
  try {
    Transaction.begin();
    var failOrderStatus = OrderMgr.failOrder(order, true);
    if (failOrderStatus === Status.ERROR) {
      throw new Error();
    }
    order.custom['2c2pPaymentMethod'] = paymentChannel;
    var check2c2pPendingStatus = co.getCustomObject('2c2pPendingStatus', _2c2pRes.response.transaction.txnRef);
    paymentTransaction.paymentInstrument.custom['2c2pLog'] = JSON.stringify(queryParam);
    if (check2c2pPendingStatus) {
      co.remove(check2c2pPendingStatus);
    }
    Transaction.commit();

          // Trigger order place email to user
    if (order.getCustomerEmail()) {
      var locale = req.locale.id ? req.locale.id : 'en_TH';
      COHelpers.sendFailOrderEmail(order, locale);
    }
  } catch (e) {
    logger.error('Error while updating the order staus to Fail' + e);
    result.error = true;
    result.message = Resource.msg('common.error.msg', '2c2p', null);
  }
}


module.exports = {
  createRequestBody: createRequestBody,
  renderCustomer: renderCustomer,
  pendingOrder: pendingOrder,
  failOrder: failOrder,
  placeOrder: placeOrder
};
