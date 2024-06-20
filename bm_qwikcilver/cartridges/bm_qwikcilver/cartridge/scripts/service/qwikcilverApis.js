/* eslint-disable no-undef */
/* eslint-disable vars-on-top */

'use strict';

// Integration with Qwikcilver API to Create, validate and redeem a Gift Card
var Logger = require('dw/system/Logger');
var logger = Logger.getLogger('ritualsQwikcilverService');
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Site = require('dw/system/Site');
var qwikcilverInitService = require('*/cartridge/scripts/service/init/qwikcilverInitService');
var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');

/**
 * getRetryCount function is responsible to get the retry count
 * @param  {boolean} isRetry is this a retry?
 * @return {integer} count re
 */
function getRetryCount(isRetry) {
  var count = 0;
  if (isRetry) {
    count = 3;
  }
  return count;
}

/**
 * Get Qwikcilver API Token
 * @returns {string} token
*/
function getAuthToken() {
  var token = null;
  try {
    var service = qwikcilverInitService.ritualsQwikcilverService;
    var serviceCredentials = service.getConfiguration().getCredential();
    var baseURL = serviceCredentials.getURL();
    var url = baseURL + 'authorize';
    service.setURL(url);
    service.setRequestMethod('POST');
    service.addHeader('DateAtClient', new Date().toISOString().substring(19, 0));
    service.addHeader('Content-Type', 'application/json');
    var qwikcilverTerminalID = Site.current.getCustomPreferenceValue('qwikcilverTerminalID');
    var forwardingEntityId = Site.current.getCustomPreferenceValue('qwikcilverForwardingEntityId');
    var qwikcilverUserName = Site.current.getCustomPreferenceValue('qwikcilverUserName');
    var qwikcilverAPIPassword = Site.current.getCustomPreferenceValue('qwikcilverAPIPassword');
    var forwardingEntityPassword = Site.current.getCustomPreferenceValue('qwikcilverForwardingEntityPassword');
    var requestObj = {
      TerminalId: qwikcilverTerminalID,
      UserName: qwikcilverUserName,
      Password: qwikcilverAPIPassword,
      forwardingEntityId: forwardingEntityId,
      forwardingEntityPassword: forwardingEntityPassword
    };
    var requestJSON = JSON.stringify(requestObj);
    var serviceResponse = service.call(requestJSON);
    if (serviceResponse.status === 'OK') {
      var serviceResponseObj = JSON.parse(serviceResponse.object);
      token = serviceResponseObj.AuthToken;
    } else {
      logger.info('Auth generation service is not success, response is {0}', JSON.stringify(serviceResponse));
    }
  } catch (e) {
    logger.error('Error in Qwikcilver Auth Token Service: {0}, {1}', e.message, e.lineNumber);
  }
  return token;
}

/**
 * Handle Auth Token And TxnID using Custom object
 * @param {boolean} tokenExpired tokenExpired
 * @returns {Object} result Custom Object Data
*/
function handleAuthTokenAndTxnID(tokenExpired, retryCount) {
  logger.info('handleAuthTokenAndTxnID Called!');
  var result = {
    authToken: null,
    transactionId: 0
  };
  var qwikcilverAPISiteID = 'RIT-' + Site.current.getCustomPreferenceValue('qwikcilverAPISiteID');
  var getCustomObject = CustomObjectMgr.getCustomObject('QwikcilverTokenAndTXNHandlers', qwikcilverAPISiteID);
  logger.info('Custom Object Initial value {0}', getCustomObject);
  if (!tokenExpired && !empty(getCustomObject) && getCustomObject.custom.authToken !== null
  && getCustomObject.custom.transactionId !== null) {
    var storedtransactionId = getCustomObject.custom.transactionId;
    if (retryCount < 3 && retryCount > 0) {
      storedtransactionId -= 1;
    }
    result = {
      authToken: getCustomObject.custom.authToken,
      transactionId: storedtransactionId
    };
    logger.info('Token not expired and not empty and Result is {0}', JSON.stringify(result));
  } else if (tokenExpired || getCustomObject.custom.authToken === null) {
    logger.info('Token is expired or  empty');
    var authToken = getAuthToken();
    logger.info('New Token is {0}', authToken);
    var transactionId = 1;
    Transaction.wrap(function () {
    // Remove existing Data and update custom object
      CustomObjectMgr.remove(getCustomObject);

      var co = CustomObjectMgr.createCustomObject('QwikcilverTokenAndTXNHandlers', qwikcilverAPISiteID);
      co.custom.authToken = authToken;
      co.custom.transactionId = transactionId;
      logger.info('New Custom Object Created, CO is {0}', co);
    });
    result = {
      authToken: authToken,
      transactionId: transactionId
    };
    logger.info('After generating new token result is {0}', JSON.stringify(result));
  }
  return result;
}

/**
 * Update Txn value
 * @param {Object} authData authData
*/
function updateTxnData(authData) {
  var qwikcilverAPISiteID = 'RIT-' + Site.current.getCustomPreferenceValue('qwikcilverAPISiteID');
  var getCustomObject = CustomObjectMgr.getCustomObject('QwikcilverTokenAndTXNHandlers', qwikcilverAPISiteID);
  Transaction.wrap(function () {
    // Remove existing Data and Update
    CustomObjectMgr.remove(getCustomObject);

    var co = CustomObjectMgr.createCustomObject('QwikcilverTokenAndTXNHandlers', qwikcilverAPISiteID);
    co.custom.authToken = authData.authToken;
    co.custom.transactionId = authData.transactionId + 1;
  });
  return false;
}

/**
 * Qwikcilver Service API Call
 * @param {string} endPoint - API endPoint
 * @param {Object} requestObj API request Object
 * @param {string} method method request
 * @returns {result} result
 */
function qwikcilverAPICall(endPoint, requestObj, method, retryCount, isretry, transaction) {
  var result;
  try {
    var service = qwikcilverInitService.ritualsQwikcilverService;
    var serviceCredentials = service.getConfiguration().getCredential();
    var callCount = retryCount;
    var baseURL = serviceCredentials.getURL();
    var url = baseURL + endPoint;
    var tokenExpired = false;
    var requestJSON;
    var authData = handleAuthTokenAndTxnID(tokenExpired, retryCount);

    if (authData.authToken !== null) {
      service.setURL(url);
      service.setRequestMethod(method);
      service.addHeader('Authorization', 'Bearer ' + authData.authToken);
      service.addHeader('DateAtClient', new Date().toISOString().substring(19, 0));
      service.addHeader('TransactionId', authData.transactionId);
      requestJSON = JSON.stringify(requestObj);
      result = service.call(requestJSON);
      // If Transaction Id is failed, create token and transaction again
      if (result.status === 'OK' && result.object !== null) {
        var resultObj = JSON.parse(result.object);
        if (resultObj.ResponseCode === 10019) {
          tokenExpired = true;
          authData = handleAuthTokenAndTxnID(tokenExpired, retryCount);
          return qwikcilverAPICall(endPoint, requestObj, method, callCount, isretry, transaction);
        }
      }
      // If Token is expired, Call API Again for new Token
      if (result.status === 'ERROR' && result.errorMessage) {
        logger.info('Verify qwikcilver error => {0} and {1}', result, result.errorMessage);
        var errorMessageObj = JSON.parse(result.errorMessage);
        if (errorMessageObj.ResponseCode === 10744) {
          tokenExpired = true;
          authData = handleAuthTokenAndTxnID(tokenExpired, retryCount);
          return qwikcilverAPICall(endPoint, requestObj, method, callCount, isretry, transaction);
        }
      }
      if (retryCount === 3) {
        updateTxnData(authData);
      }
      // in case of service unavailable and connection reset call the API again
      if (isretry) {
        if (result && result.errorMessage && (('status' in result && result.getStatus().equals('SERVICE_UNAVAILABLE')) || (result.msg === 'Connection reset'))) {
          if (callCount > 0) {
            logger.info('Retry function for' + transaction + 'is call with request {0}', JSON.stringify(requestObj));
            callCount -= 1;
            return qwikcilverAPICall(endPoint, requestObj, method, callCount, isretry, transaction);
          }
        } else {
          logger.info('QC Retry ' + transaction + ' Service response {0}', result.status);
        }
      }
      if (result.status === 'OK' && result.object) {
        var resultObject = JSON.stringify(result.object);
        logger.info('QC Service ' + transaction + ' response{0}', resultObject);
      } else {
        logger.info('QC Service ' + transaction + ' Error{0}', JSON.stringify(result));
      }
      return result;
    }
  } catch (e) {
    logger.error('Error in Qwikcilver Service: {0}, {1}', e.message, e.lineNumber);
  }
  return result;
}

/**
 * Get Card Details from lineItem
 * @param {Object} giftCardtLineItems giftCardtLineItems
 * @returns {Object} cards cards
 */
function getCardDetails(giftCardtLineItems) {
  var qwikcilverCPGName = Site.current.getCustomPreferenceValue('qwikcilverCPGName');
  var cards = [];
  var itemObj = {
    CardProgramGroupName: qwikcilverCPGName,
    Amount: giftCardtLineItems.adjustedGrossPrice.value,
    CurrencyCode: session.currency.currencyCode
  };
  cards.push(itemObj);
  return cards;
}

/**
 * Call to Qwikcilver service to Create a new Gift Card
 * @param {Object} order order
 * @returns {serviceResonse} Service Response
 */
function createGiftCards(order, GCNumber) {
  var cardItem = order.getAllProductLineItems();
  var isretry = true;
  var requestObj = {
    TransactionTypeId: '305',
    InputType: '3',
    InvoiceNumber: 'Inv-' + order.orderNo,
    NumberOfCards: '1',
    IdempotencyKey: 'IKey-' + order.orderNo + '-' + GCNumber,
    Purchaser: {
      FirstName: order.getBillingAddress().firstName,
      LastName: order.getBillingAddress().lastName,
      Email: order.getCustomerEmail(),
      Mobile: order.getBillingAddress().phone
    },
    Cards: getCardDetails(cardItem[GCNumber]),
    Notes: 'Create And Issue a Gift Card'
  };
  var retryCount = getRetryCount(isretry);
  logger.info('Request object of gift card creation is {0}', JSON.stringify(requestObj));
  var returnCard = qwikcilverAPICall('gc/transactions', requestObj, 'POST', retryCount, isretry, 'Create GiftCard');
  if (returnCard.object) {
    qwikcilverHelpers.saveGiftCardData(order, returnCard, GCNumber);
  }
  return returnCard;
}

/**
 * Call to Qwikcilver service to Check Gift Card Balance
 * @param {string} cardNumber cardNumber
 * @returns {serviceResonse} Service Response
 */
function checkCardBalance(cardNumber) {
  var isretry = false;
  var requestObj = {
    TransactionTypeId: 306,
    InputType: '1',
    Cards: [{
      CardNumber: cardNumber
    }]
  };
  var retryCount = getRetryCount(isretry);
  return qwikcilverAPICall('gc/transactions', requestObj, 'POST', retryCount, isretry, 'Balance Enquiry');
}

/**
 * Validate GiftCard
 * @param {string} cardNumber cardNumber
 * @param {string} CardPin cardPin
 * @returns {serviceResonse} Service Response
 */
function validateGiftCard(cardNumber, CardPin) {
  var isretry = false;
  var requestObj = {
    TransactionTypeId: 302,
    InputType: '1',
    Cards: [
      {
        CardNumber: cardNumber,
        CardPin: CardPin
      }
    ]
  };
  var retryCount = getRetryCount(isretry);
  return qwikcilverAPICall('gc/transactions/validate', requestObj, 'POST', retryCount, isretry, 'Balance Enquiry');
}

/**
 * Get Card Payment Instrument Details
 * @param {Object} giftPaymentInstruments giftPaymentInstruments
 * @returns {Object} cards cards
 */
function getPaymentCardDetails(giftPaymentInstruments) {
  var cards = [];
  for (var i = 0; i < giftPaymentInstruments.length; i += 1) {
    if (giftPaymentInstruments[i].paymentMethod === 'GIFT_CERTIFICATE') {
      var cardObj = {
        CardNumber: giftPaymentInstruments[i].custom.cardNumber,
        CardPin: qwikcilverHelpers.decodeFromBase64(giftPaymentInstruments[i].custom.cardPin),
        Amount: giftPaymentInstruments[i].paymentTransaction.amount.value
      };
      cards.push(cardObj);
    }
  }
  return cards;
}

/**
 * Call to Qwikcilver service to redeem a GiftCards
 * @param {Object} order order
 * @param {string} cardNumber cardNumber
 * @param {string} cardPin cardPin
 * @returns {serviceResonse} Service Response
 */
function redeemGiftCards(order) {
  var giftPaymentInstruments = order.getPaymentInstruments();
  var cardDetails = getPaymentCardDetails(giftPaymentInstruments);
  var isretry = true;
  var requestObj = {
    TransactionTypeId: 302,
    InputType: '1',
    InvoiceNumber: 'Inv-' + order.orderNo,
    IdempotencyKey: 'Ikey-' + order.orderNo,
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceAmount: order.getTotalGrossPrice().value,
    BillAmount: order.getTotalGrossPrice().value,
    Purchaser: {
      FirstName: order.getBillingAddress().firstName,
      LastName: order.getBillingAddress().lastName,
      Email: order.getCustomerEmail(),
      Mobile: order.getBillingAddress().phone
    },
    cards: cardDetails
  };
  var retryCount = getRetryCount(isretry);
  logger.info('Request object of gift card redemption is {0}', JSON.stringify(requestObj));
  return qwikcilverAPICall('gc/transactions', requestObj, 'POST', retryCount, isretry, 'Redeem Card');
}

module.exports = {
  createGiftCards: createGiftCards,
  validateGiftCard: validateGiftCard,
  redeemGiftCards: redeemGiftCards,
  checkBalance: checkCardBalance
};
