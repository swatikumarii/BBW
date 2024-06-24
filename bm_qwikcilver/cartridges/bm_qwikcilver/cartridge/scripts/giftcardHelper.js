/* eslint-disable func-names */
/* eslint-disable vars-on-top */
/* eslint-disable global-require */

'use strict';

var Logger = require('dw/system/Logger');
var logger = Logger.getLogger('ritualsQwikcilverService');
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Site = require('dw/system/Site');
var Encoding = require('dw/crypto/Encoding');
var Bytes = require('dw/util/Bytes');

/**
 * forEach method for dw.util.Collection subclass instances
 * @param {dw.util.Collection} collection - Collection subclass instance to map over
 * @param {Function} callback - Callback function for each item
 * @param {Object} [scope] - Optional execution scope to pass to callback
 * @returns {void}
 */
function forEach(collection, callback, scope) {
  var iterator = collection.iterator();
  var index = 0;
  var item = null;
  while (iterator.hasNext()) {
    item = iterator.next();
    if (scope) {
      callback.call(scope, item, index, collection);
    } else {
      callback(item, index, collection);
    }
    index += 1;
  }
}

/**
 * Encode String To Base64
 * @param {string} cardPin giftcard pin to be encoded
 * @return {string} encodedCardPin
*/
function encodeToBase64(cardPin) {
  var encodedCardPin = Encoding.toBase64(new Bytes(cardPin, 'UTF-8'));
  return encodedCardPin;
}

/**
 * Get Qwikcilver API Token
 * @returns {string} token
*/
function getAuthToken() {
  var token = null;
  try {
    var qwikcilverInitService = require('*/cartridge/scripts/service/init/qwikcilverInitService');
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
    var qwikcilverInitService = require('*/cartridge/scripts/service/init/qwikcilverInitService');
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
        if (result && result.errorMessage
            && (('status' in result && result.getStatus().equals('SERVICE_UNAVAILABLE'))
            || (result.msg === 'Connection reset'))) {
          if (callCount > 0) {
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
    CurrencyCode: giftCardtLineItems.basePrice.currencyCode
  };
  cards.push(itemObj);
  return cards;
}

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
 * Call to Qwikcilver service to Create a new Gift Card
 * @param {Object} order order
 * @returns {serviceResonse} Service Response
 */
function createGiftCards(order, giftLineItem) {
  var isretry = true;
  var requestObj = {
    TransactionTypeId: '305',
    InputType: '3',
    InvoiceNumber: 'Inv-' + order.orderNo,
    NumberOfCards: '1',
    IdempotencyKey: 'IKey-' + order.orderNo + '-' + giftLineItem.UUID,
    Purchaser: {
      FirstName: order.getBillingAddress().firstName,
      LastName: order.getBillingAddress().lastName,
      Email: order.getCustomerEmail(),
      Mobile: order.getBillingAddress().phone
    },
    Cards: getCardDetails(giftLineItem),
    Notes: 'Create And Issue a Gift Card'
  };
  var retryCount = getRetryCount(isretry);
  logger.info('Request object of gift card creation is {0}', JSON.stringify(requestObj));
  var returnCard = qwikcilverAPICall('gc/transactions', requestObj, 'POST', retryCount, isretry, 'Create GiftCard');
  return returnCard;
}

function getContext(giftLineItem) {
  var ProductMgr = require('dw/catalog/ProductMgr');
  var giftProduct = ProductMgr.getProduct(giftLineItem.productID);
  var images = giftProduct.getImages('large');
  var large = [];
  forEach(images, function (image, index) {
    large.push({
      alt: image.alt,
      url: image.URL.toString(),
      index: index.toString(),
      title: image.title,
      absURL: image.absURL.toString()
    });
  });
  var lineItem = {
    images: { large: large }
  };
  var expiryDate = new Date(giftLineItem.custom.eGiftCardExpiry);
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var context = {
    recipientEmail: giftLineItem.custom.eGiftReceiverEmail,
    recipientName: giftLineItem.custom.eGiftReceiver,
    senderName: giftLineItem.custom.eGiftSender,
    giftcardNumber: giftLineItem.custom.eGiftCardNumber,
    eGiftMessage: giftLineItem.custom.eGiftMessage,
    cardPin: Encoding.fromBase64(giftLineItem.custom.eGiftCardPin).toString(),
    eGiftBarCode: giftLineItem.custom.eGiftCardBarcode,
    eGiftBarCodeURL: Site.current.getCustomPreferenceValue('qwikcilverEGiftBarCodeUrl')
     + giftLineItem.custom.eGiftCardBarcode,
    amount: giftLineItem.basePrice.currencyCode + giftLineItem.basePrice.value,
    expiryDate: expiryDate.getDate() + ' ' + months[expiryDate.getMonth()]
     + ' ' + expiryDate.getFullYear(),
    lineItem: lineItem,
    sendEmailNow: true
  };
  return context;
}

function getNewContext(order, giftLineItem) {
  var OrderMgr = require('dw/order/OrderMgr');
  var response = createGiftCards(order, giftLineItem);
  var parsedResponse = JSON.parse(response.object);
  var updatedGiftLineItem;
  var apiOrder = OrderMgr.getOrder(order.orderNo);
  Transaction.wrap(function () {
    forEach(apiOrder.productLineItems, function (lineItem, index) {
      if (lineItem.UUID === giftLineItem.UUID) {
        OrderMgr.getOrder(order.orderNo).productLineItems[index]
          .custom.cardNumber = parsedResponse.Cards[0].CardNumber;
        OrderMgr.getOrder(order.orderNo).productLineItems[index]
          .custom.cardPin = encodeToBase64(parsedResponse.Cards[0].CardPin);
        OrderMgr.getOrder(order.orderNo).productLineItems[index]
          .custom.cardExpiryDate = parsedResponse.Cards[0].ExpiryDate;
        OrderMgr.getOrder(order.orderNo).productLineItems[index]
          .custom.eGiftBarCode = parsedResponse.Cards[0].BarCode;
      }
    });
  });
  forEach(apiOrder.productLineItems, function (lineItem) {
    if (lineItem.UUID === giftLineItem.UUID) {
      updatedGiftLineItem = lineItem;
    }
  });
  return getContext(updatedGiftLineItem);
}

module.exports = {
  getContext: getContext,
  getNewContext: getNewContext
};
