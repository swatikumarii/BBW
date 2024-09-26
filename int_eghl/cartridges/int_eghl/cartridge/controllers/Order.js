
/**
 * @File Name          : Order.js
 * @Description        : Order.js Controller file extending core functionality of default SFRA
 * @Modification Log   : VS-Changes
 * Ver       Modification
 * 1.0    Update order confirmation flow for eGHL
 * 2.0    Resolve linting errors
**/

'use strict';

var server = require('server');
server.extend(module.superModule);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var logger = require('dw/system/Logger').getLogger('eghl');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Transaction = require('dw/system/Transaction');
var Status = require('dw/system/Status');
var Locale = require('dw/util/Locale');
var OrderModel = require('*/cartridge/models/order');
var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
var qwikcilverApis = require("*/cartridge/scripts/service/qwikcilver/apis");

/**
 * renderCustomer function is responsible to render the customer on order success page
 * @param  {Object} order Order object
 * @param  {Object} result Place order object
 * @param  {Object} orderStatus order status object
 * @param  {request} req current request
 * @param  {response} res Response to customer
 */
function renderCustomer(order, result, orderStatus, req, res) {
    var config = {
        numberOfLineItems: '*'
    };

    var currentLocale;
    if ('locale' in req && req.locale.id) {
        currentLocale = Locale.getLocale(req.locale.id).country;
    }

    var orderModel = new OrderModel(
        order,
        { config: config, countryCode: currentLocale, containerView: 'order' }
    );
    var passwordForm;

    var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);
    var viewData = res.getViewData();
    viewData.isThankYouPage = true;
    viewData.orderStatusVal = Order;
    res.setViewData(viewData);
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
            orderStatusVal: order
        });
    } else {
        res.render('checkout/confirmation/confirmation', {
            order: orderModel,
            returningCustomer: true,
            reportingURLs: reportingURLs,
            orderUUID: order.getUUID(),
            orderStatus: orderStatus,
            orderStatusVal: order
        });
    }
    req.session.raw.custom.orderID = req.querystring.ID; // eslint-disable-line no-param-reassign
}

/**
 * pendingOrder function is responsible to update the order status to pending
 * @param  {Object} order Order object
 * @param  {boolean} isEhlCallback eghlCallback flag
 * @param  {Object} req Request data
 * @param  {Object} res Response Data
 * @param  {pointer} next pointer
 */
function pendingOrder(order, isEhlCallback, req, res, next) {
    var co = require('dw/object/CustomObjectMgr');
    var result = { error: false, message: '' };
    var queryParam = req.httpParameterMap;
    var paymentTransaction = order.paymentInstrument.getPaymentTransaction();
    try {
        Transaction.begin();
        paymentTransaction.paymentInstrument.paymentTransaction.transactionID = queryParam.TxnID.value;
        order.custom.eghlPaymentId = queryParam.PaymentID.value; // eslint-disable-line no-param-reassign
        order.custom.eghlTxnId = queryParam.TxnID.value; // eslint-disable-line no-param-reassign
        var paymentMethodName;
        if (queryParam.PymtMethod.value == "CC") {
          paymentMethodName = "eGHLCredit Card";
        } else if (queryParam.PymtMethod.value == "DD") {
          paymentMethodName = "eGHLOnline Banking";
        } else if (queryParam.PymtMethod.value == "WA") {
          paymentMethodName = "eGHLeWallet";
        } else {
          paymentMethodName = "eGHL";
        }
        order.custom.eghlPaymentMethod = paymentMethodName;
        paymentTransaction.paymentInstrument.custom.eghlLog = queryParam;

        var checkEghlNotofication = co.getCustomObject('eghlNotification', queryParam.ID.value);
        if (checkEghlNotofication) {
            checkEghlNotofication.custom.eghlLog = queryParam;
        } else {
            var updatEghlNotifiaction = co.createCustomObject('eghlNotification', queryParam.ID.value);
            updatEghlNotifiaction.custom.eghlLog = queryParam;
        }

        Transaction.commit();
        if (!isEhlCallback) {
            var orderStatus = queryParam.TxnStatus.value;
            renderCustomer(order, result, orderStatus, req, res, next);
        }
    } catch (e) {
        logger.error('Error while updating the pending payment data' + e);
        result.error = true;
        result.message = Resource.msg('common.error.msg', 'eghl', null);
    }
}

/**
 * failOrder function is responsible to update the order status to fail
 * @param  {Object} order Order object
 * @param  {boolean} isEhlCallback eghlCallback flag
 * @param  {Request} req Request Object
 * @param  {Response} res Response Object
 * @param  {pointer} next pointer
 */
function failOrder(order, isEhlCallback, req, res, next) {
    var result = { error: false, message: '' };
    var queryParam = req.httpParameterMap;
    var paymentTransaction = order.paymentInstrument.getPaymentTransaction();
    try {
        Transaction.begin();
        var failOrderStatus = OrderMgr.failOrder(order, true);
        if (failOrderStatus == Status.ERROR) {
            throw new Error();
        }
        paymentTransaction.paymentInstrument.paymentTransaction.transactionID = queryParam.TxnID.value;
        order.custom.eghlPaymentId = queryParam.PaymentID.value; // eslint-disable-line no-param-reassign
        order.custom.eghlTxnId = queryParam.TxnID.value; // eslint-disable-line no-param-reassign
        var paymentMethodName;
        if (queryParam.PymtMethod.value == "CC") {
          paymentMethodName = "eGHLCredit Card";
        } else if (queryParam.PymtMethod.value == "DD") {
          paymentMethodName = "eGHLOnline Banking";
        } else if (queryParam.PymtMethod.value == "WA") {
          paymentMethodName = "eGHLeWallet";
        } else {
          paymentMethodName = "eGHL";
        }
        order.custom.eghlPaymentMethod = paymentMethodName
        paymentTransaction.paymentInstrument.custom.eghlLog = queryParam;
        Transaction.commit();

        // Trigger order place email to user
        // if (order.getCustomerEmail()) {
        //     COHelpers.sendFailOrderEmail(order, req.locale.id);
        // }
        if (!isEhlCallback) {
            var orderStatus = queryParam.TxnStatus.value;
            renderCustomer(order, result, orderStatus, req, res, next);
        }
    } catch (e) {
        logger.error('Error while updating the order staus to Fail' + e);
        result.error = true;
        result.message = Resource.msg('common.error.msg', 'eghl', null);
    }
}

/**
 * placeOrder function is responsible to update the order staus accoding to eGHL txn status
 * @param  {Object} order order object
 * @param  {boolean} isEhlCallback eghlCallback flag
 * @param  {request} req  request object
 * @param  {response} res response object
 * @param  {pointer} next pointer
 */
function placeOrder(order, isEhlCallback, req, res, next, paymentMethod) {
    var currentLocale;
    if ("locale" in req && req.locale.id) {
      currentLocale = Locale.getLocale(req.locale.id);
    } else {
      currentLocale = "en_PH";
    }
    var result = { error: false, message: '' };
    var queryParam = req.httpParameterMap;
    var paymentTransaction = order.paymentInstrument.getPaymentTransaction();
    var qwikcilverHelpers = require("*/cartridge/scripts/helpers/qwikcilverHelpers");
    var isGiftProductAvailable = qwikcilverHelpers.validateGiftProduct(order);
    var qwikcilverApis = require("*/cartridge/scripts/service/qwikcilver/apis");
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
        if (placeOrderStatus == Status.ERROR) {
            throw new Error();
        }
        logger.info('EGHL:Order is placed from eghl Order controller {0}', order.orderNo);
        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);

        order.setExportStatus(Order.EXPORT_STATUS_READY);
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        paymentTransaction.paymentInstrument.paymentTransaction.transactionID = queryParam.TxnID.value;
        order.custom.eghlPaymentId = queryParam.PaymentID.value; // eslint-disable-line no-param-reassign
        order.custom.eghlTxnId = queryParam.TxnID.value; // eslint-disable-line no-param-reassign
        var paymentMethodName;
        if (queryParam.PymtMethod.value == "CC") {
          paymentMethodName = "eGHLCredit Card";
        } else if (queryParam.PymtMethod.value == "DD") {
          paymentMethodName = "eGHLOnline Banking";
        } else if (queryParam.PymtMethod.value == "WA") {
          paymentMethodName = "eGHLeWallet";
        } else {
          paymentMethodName = "eGHL";
        }
        order.custom.eghlPaymentMethod = paymentMethodName;
        paymentTransaction.paymentInstrument.custom.eghlLog = queryParam;
        Transaction.commit();

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

        // Trigger order place email to user
        if (order.getCustomerEmail()) {
            COHelpers.sendConfirmationEmail(order, req.locale.id);
        }
        if (!isEhlCallback) {
            var orderStatus = queryParam.TxnStatus.value;
            renderCustomer(order, result, orderStatus, req, res, next);
        }
    } catch (e) {
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        logger.error('Error while placing the order. Error response is' + e);
        result.error = true;
        result.message = Resource.msg('common.error.msg', 'eghl', null);
    }
}

/**
 * Order-Confirm : This endpoint is invoked to order confirmation
 * @name Base/Order-Confirm
 * @function
 * @memberof Order
 * @param {serverfunction} - prepend
 */
server.prepend('Confirm',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var queryData = req.querystring;
        var queryOrderId = queryData.ID;
        var orderToken = queryData.orderToken ? queryData.orderToken : null;
        var order = OrderMgr.getOrder(queryOrderId);
        if (!order
            || !orderToken
            || orderToken !== order.orderToken
        ) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }
        var lastOrderID = Object.prototype.hasOwnProperty.call(req.session.raw.custom, 'orderID') ? req.session.raw.custom.orderID : null;
        if (lastOrderID == req.querystring.ID) {
            res.redirect(URLUtils.url('Home-Show'));
            return next();
        }

        var orderPaymentInstruments = order.getPaymentInstruments();
        var instrumentcount;
        var eghlPaymentInstrumentExists = false;
        for (instrumentcount = 0; instrumentcount < orderPaymentInstruments.length; instrumentcount++) {
            if (orderPaymentInstruments[instrumentcount].paymentMethod === 'EGHL') {
                eghlPaymentInstrumentExists = true
            }
        }
        if (orderPaymentInstruments.length > 0 && eghlPaymentInstrumentExists) {
            var eghlHelper = require('*/cartridge/scripts/helpers/eghlHelper');
            var eghlApi = require('*/cartridge/scripts/service/eGHLApi');
            var eGHLPreference = require('*/cartridge/scripts/service/eGHLPreference');
            var eghlServiceCredentials = eghlApi.getServiceCredentials();
            var requestParameter = req.httpParameterMap;
            logger.error('EGHL:Callback data from EGHL in order controller is {0}', JSON.stringify(requestParameter));
            var requestOrderId = requestParameter.ID.value;

             // save address
            if (session.privacy.addressBook && session.privacy.saveAddress) {
                var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
                var address = addressHelpers.copyShippingAddress(order.billingAddress);
                // save all used billing addresses to address book of the logged in customer
                if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
                    addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address), true);
                }
                session.privacy.addressBook = null;
                session.privacy.saveAddress = null;
            }

            // save billingaddress dial code and dial code country
            if (session.privacy.billingDialCode && session.privacy.billingDialCodeCountry) {
                Transaction.wrap(function () {
                    order.billingAddress.custom.dialCode = session.privacy.billingDialCode;
                    order.billingAddress.custom.dialCodeCountry = session.privacy.billingDialCodeCountry;
                });
                session.privacy.billingDialCode = null;
                session.privacy.billingDialCodeCountry = null;
            }

            if (requestOrderId == queryOrderId) {
                if (order.status.value == Order.ORDER_STATUS_CREATED) {
                    // Get data from eGHL response

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
                        var isEhlCallback = false;
                        if (txnStatus == eGHLPreference.txnSuccessStatus) {
                            logger.error('EGHL:Successfull callback on order controller for order id {0}', requestOrderId);
                            placeOrder(order, isEhlCallback, req, res, next, requestParameter.PymtMethod.rawValue);
                            this.emit('route:Complete', req, res);
                            // eslint-disable-next-line consistent-return
                            return;
                        } else if (txnStatus == eGHLPreference.txnFailedStatus) {
                            failOrder(order, isEhlCallback, req, res, next);
                            this.emit('route:Complete', req, res);
                            // eslint-disable-next-line consistent-return
                            return;
                        } else if (txnStatus == eGHLPreference.txnPendingStatus) {
                            pendingOrder(order, isEhlCallback, req, res, next);
                            this.emit('route:Complete', req, res);
                            // eslint-disable-next-line consistent-return
                            return;
                        }
                    } else {
                        logger.error('Unauthorized order access of order id' + requestOrderId + 'Hash value does not match');
                        res.redirect(URLUtils.url('Home-Show'));
                        // eslint-disable-next-line consistent-return
                        return;
                    }
                } else {
                    renderCustomer(order, { error: false, message: '' }, requestParameter.TxnStatus.value, req, res, next);
                    this.emit('route:Complete', req, res);
                    // eslint-disable-next-line consistent-return
                    return;
                }
            } else {
                // In case of wrong order id redirect user to home page
                logger.error('Wrong order id from eGHL. Order id from eGHL is' + requestOrderId + 'and order id from request is' + queryOrderId);
                res.redirect(URLUtils.url('Home-Show'));
                return next();
            }
        }
        return next();
    });

module.exports = server.exports();
