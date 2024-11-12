'use strict';

/* API Includes */
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
/* Script Modules */

/**
 * removes other payment instruments from basket and saves afterpay
 * @param {string} paymentMethodName - paymentMethodName
 * @param {object} basket - basket
 * @param {string} paymentInformation - paymentInformation
 * @returns {object} - errors
 */
function Handle(paymentMethodName, basket, paymentInformation) {
    var currentBasket = basket;

    if (!paymentMethodName) {
        return {
            error: true
        };
    }
    if (paymentMethodName === 'GIFT_CERTIFICATE') {
        return { fieldErrors: {}, serverErrors: [], error: false };
    }

    Transaction.wrap(function () {
        // GIFT_CERTIFICATE payment changes
        var Money = require('dw/value/Money');
        var Site = require('dw/system/Site');
        var eGiftEnabled = Site.current.getCustomPreferenceValue('enableQwikcilver');
        if (eGiftEnabled && currentBasket.custom.eGiftTotalAmount && currentBasket.custom.eGiftTotalAmount > 0) {
            // Add remaining total to credit card
            var grandtotal = new Money((currentBasket.totalGrossPrice.value - currentBasket.custom.eGiftTotalAmount), currentBasket.getCurrencyCode());

            if (paymentMethodName === 'AdyenComponent' || paymentMethodName === 'CREDIT_CARD') {
                var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
                var constants = require('*/cartridge/adyenConstants/constants');
                var paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, grandtotal);

                paymentInstrument.custom.adyenPaymentData = paymentInformation.stateData;
                paymentInstrument.custom.adyenPaymentMethod = paymentInformation.adyenPaymentMethod;

                if (paymentInformation.isCreditCard) {
                    // If the card wasn't a stored card we need to convert sfccCardType
                    var sfccCardType = !paymentInformation.creditCardToken ? AdyenHelper.getSfccCardType(paymentInformation.cardType) : paymentInformation.cardType;
                    paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
                    paymentInstrument.setCreditCardType(sfccCardType);
                    paymentInstrument.custom.adyenPaymentMethod = sfccCardType;

                    if (paymentInformation.creditCardToken) {
                        paymentInstrument.setCreditCardExpirationMonth(paymentInformation.expirationMonth);
                        paymentInstrument.setCreditCardExpirationYear(paymentInformation.expirationYear);
                        paymentInstrument.setCreditCardToken(paymentInformation.creditCardToken);
                    }
                }
            } else if (paymentMethodName === 'AFTERPAY') {
                currentBasket.createPaymentInstrument(
                    paymentMethodName, grandtotal
                );
            } else if (paymentMethodName === 'Doku') {
                currentBasket.createPaymentInstrument(
                    paymentMethodName, grandtotal
                );
            } else if (paymentMethodName === 'ovo') {
                currentBasket.createPaymentInstrument(
                    paymentMethodName, grandtotal
                );
            } else if (paymentMethodName === 'EGHL') {
                currentBasket.createPaymentInstrument(
                    paymentMethodName, grandtotal
                );
            }
        } else {
            currentBasket.createPaymentInstrument(
                paymentMethodName, currentBasket.totalGrossPrice
            );
        }
    });

    return { fieldErrors: {}, serverErrors: [], error: false };
}

/**
 * default hook if no payment processor is supported
 * @param {object} order order
 * @param {object} paymentInstrument paymentInstrument
 * @param {object} paymentProcessor paymentProcessor
 * @returns {object} an object that contains error information
 */
function Authorize(order, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    var orderNumber = order.orderNo;

    try {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
        });
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
    }

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
