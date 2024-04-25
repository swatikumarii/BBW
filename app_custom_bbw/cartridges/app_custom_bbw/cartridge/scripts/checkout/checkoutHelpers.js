'use strict';

var base = module.superModule;

var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');

/**
 * Validates payment
 * @param {object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {object} an object that has error information
 */
function validatePayment(req, currentBasket) {
    var applicablePaymentCards;
    var applicablePaymentMethods;
    var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    var paymentAmount = currentBasket.totalGrossPrice.value;
    var countryCode = currentBasket.shipments[0].shippingAddress.countryCode.value;
    var currentCustomer = req.currentCustomer.raw;
    var paymentInstruments = currentBasket.paymentInstruments;
    var result = {};

    applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(
        currentCustomer,
        countryCode,
        paymentAmount
    );
    applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
        currentCustomer,
        countryCode,
        paymentAmount
    );

    var invalid = true;

    for (var i = 0; i < paymentInstruments.length; i++) {
        var paymentInstrument = paymentInstruments[i];

        if (PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.paymentMethod)) {
            invalid = false;
        }

        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());

        if (paymentMethod && applicablePaymentMethods.contains(paymentMethod)) {
            if (PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstrument.paymentMethod)) {
                var card = PaymentMgr.getPaymentCard(paymentInstrument.creditCardType);

                // Checks whether payment card is still applicable.
                if (card && applicablePaymentCards.contains(card)) {
                    invalid = false;
                }
            } else {
                invalid = false;
            }
        }

        if (invalid) {
            break; // there is an invalid payment instrument
        }
    }

    result.error = invalid;
    return result;
}

base.validatePayment = validatePayment;

module.exports = base;
