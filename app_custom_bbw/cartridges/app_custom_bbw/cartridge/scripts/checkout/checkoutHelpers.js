'use strict';

var base = module.superModule;

var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
var emailContentHelpers = require('*/cartridge/scripts/helpers/emailContentHelpers');
var ContentMgr = require('dw/content/ContentMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var OrderMgr = require('dw/order/OrderMgr');
var HookMgr = require('dw/system/HookMgr');
var Logger = require('dw/system/Logger');
var loggerOrderConfirmation = Logger.getLogger('CheckoutHelpersOrder');

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

/**
 * Sends a confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
function sendConfirmationEmail(order, locale) {
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var emailMarkup = '';
    var emailContent = ContentMgr.getContent('email-order-confirmation'); // Order Confirmation Email Content Asset Id
    var currentLocale = Locale.getLocale(locale);

    loggerOrderConfirmation.info(
        'Order Confirmation mail trigger for this ' + order.customerEmail
    );

    if (!empty(emailContent) && emailContent.online) {
        emailMarkup = emailContent.custom.body.markup;
    }
    var orderModel = new OrderModel(order, { countryCode: currentLocale.country, containerView: 'order' });

    var orderObject = {
        order: orderModel,
        markup: emailMarkup,
        content: emailContentHelpers.getEmailContent('normal-footer','email-header')
    };

    var emailObj = {
        to: order.customerEmail,
        subject: Resource.msgf('subject.order.confirmation.email', 'order', null, orderModel.orderNumber),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.orderConfirmation
    };

    try {
        emailHelpers.sendEmail(
            emailObj,
            'checkout/confirmation/confirmationEmail',
            orderObject
        );
    } catch (e) {
        loggerOrderConfirmation.error(
            'Error in Sending Order Confirmation mail ' + e.message
        );
    }

    loggerOrderConfirmation.info(
        'Order Confirmation mail successfully sended for this ' +
            order.customerEmail
    );
}

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {object} an error object
 */
function handlePayments(order, orderNumber) {
    var result = {};

    if (order.totalNetPrice !== 0.00) {
        var paymentInstruments = order.paymentInstruments;

        if (paymentInstruments.length === 0) {
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            result.error = true;
        }

        if (!result.error) {
            for (var i = 0; i < paymentInstruments.length; i++) {
                var paymentInstrument = paymentInstruments[i];
                var paymentProcessor = PaymentMgr
                    .getPaymentMethod(paymentInstrument.paymentMethod)
                    .paymentProcessor;
                var authorizationResult;
                if (paymentProcessor === null) {
                    Transaction.begin();
                    paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                    Transaction.commit();
                } else {
                    if (HookMgr.hasHook('app.payment.processor.'
                            + paymentProcessor.ID.toLowerCase())) {
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                            'Authorize',
                            order,
                            paymentInstrument,
                            paymentProcessor
                        );
                    } else {
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.default',
                            'Authorize'
                        );
                    }

                    if (authorizationResult.error) {
                        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
                        result.error = true;
                        break;
                    }
                }
            }
        }
    }

    return result;
}


/**
 * Sets the payment transaction amount
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {object} an error object
 */
function calculatePaymentTransaction(currentBasket) {
    var result = { error: false };

    try {
        // If Gift Certificate and Adyen payment with Remaining amount is already added
        // Return error false
        if (currentBasket.getPaymentInstruments('GIFT_CERTIFICATE').length > 0 && currentBasket.getPaymentInstruments('AdyenComponent').length > 0) {
            result.error = false;
        }
        // If Gift Certificate and Pace with Remaining amount is already added
        // Return error false
        else if (currentBasket.getPaymentInstruments('GIFT_CERTIFICATE').length > 0 && currentBasket.getPaymentInstruments('AFTERPAY').length > 0) {
            result.error = false;
        } else {
            Transaction.wrap(function () {
                var paymentInstruments = currentBasket.paymentInstruments;

                if (!paymentInstruments.length) {
                    return;
                }

                // Assuming that there is only one payment instrument used for the total order amount.
                // TODO: Will have to rewrite this logic once we start supporting multiple payment instruments for same order
                var orderTotal = currentBasket.totalGrossPrice;
                var paymentInstrument = paymentInstruments[0];
                paymentInstrument.paymentTransaction.setAmount(orderTotal);
            });
        }
    } catch (e) {
        result.error = true;
    }

    return result;
}

/**
 * Attempts to place the order
 * @param {dw.order.Order} order - The order object to be placed
 * @param {object} fraudDetectionStatus - an Object returned by the fraud detection hook
 * @returns {object} an error object
 */
function placeOrder(order, fraudDetectionStatus) {
    var Order = require('dw/order/Order');
    var Status = require('dw/system/Status');
    var result = { error: false };
    var adyenGiftcardFailed = false;
    if (order.getPaymentInstruments('GIFT_CERTIFICATE').length > 0 && order.getPaymentInstruments('AdyenComponent').length > 0) {
        var giftCardAPIRedeemResultAdyen;
        var qwikcilverApis = require('*/cartridge/scripts/service/qwikcilver/apis');
        var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
        // Handles Gift payment authorization
        handlePayments(order, order.orderNo);
        // Redeem Qwikcilver Gift Card
        if (order.getPaymentInstruments('GIFT_CERTIFICATE').length > 0) {
            giftCardAPIRedeemResultAdyen = qwikcilverApis.redeemGiftCards(order);
            if (giftCardAPIRedeemResultAdyen) {
                var redeemedGiftCardAdyen = JSON.parse(giftCardAPIRedeemResultAdyen.object);
                if (redeemedGiftCardAdyen.ResponseCode === 0) {
                    qwikcilverHelpers.saveGiftCardDetails(order, redeemedGiftCardAdyen, 'Redeemed');
                } else {
                    adyenGiftcardFailed = true;
                }
            } else {
                adyenGiftcardFailed = true;
            }
            if (adyenGiftcardFailed) {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order, true);
                    order.custom.giftcardFailed = true; // eslint-disable-line no-param-reassign
                });
                result.error = true;
            }
        }
    }
    if (!adyenGiftcardFailed) {
        try {
            Transaction.begin();
            var placeOrderStatus = OrderMgr.placeOrder(order);
            if (placeOrderStatus === Status.ERROR) {
                throw new Error();
            }

            if (fraudDetectionStatus.status === 'flag') {
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
            } else {
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            }

            order.setExportStatus(Order.EXPORT_STATUS_READY);
            Transaction.commit();
        } catch (e) {
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            result.error = true;
        }
    }
    return result;
}

/**
 * Copies a CustomerAddress to a Basket as its Billing Address
 * @param {dw.customer.CustomerAddress} address - The customer address
 */
function copyBillingAddressToBasket(address) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var billingAddress = currentBasket && currentBasket.billingAddress;

    Transaction.wrap(function () {
        if (!billingAddress) {
            billingAddress = currentBasket.createBillingAddress();
        }

        billingAddress.setFirstName(address.firstName);
        billingAddress.setLastName(address.lastName);
        billingAddress.setAddress1(address.address1);
        billingAddress.setAddress2(address.address2);
        billingAddress.setCity(address.city);
        billingAddress.setPostalCode(address.postalCode);
        billingAddress.setStateCode(address.stateCode);
        var countryCode = address.countryCode;
        billingAddress.setCountryCode(countryCode.value);
        billingAddress.setPhone(address.phone);
        if (address.custom && address.custom.district) {
            billingAddress.custom.district = address.custom.district;
        }
        if (address.custom && address.custom.subDistrict) {
            billingAddress.custom.subDistrict = address.custom.subDistrict;
        }
    });
}

/**
 * Sends a confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
function sendFailedOrderEmail(order, locale) {
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var emailMarkup = '';
    var emailTopMarkup = '';
    var emailContent = ContentMgr.getContent('email-order-confirmation'); // Payment Failed Email Content Asset Id
    var emailTopContent = ContentMgr.getContent('email-good-to-konw-block'); // Payment Failed Top Content Email Content Asset Id
    var currentLocale = Locale.getLocale(locale);

    if (!empty(emailContent) && emailContent.online) {
        emailMarkup = emailContent.custom.body.markup;
    }

    if (!empty(emailTopContent) && emailTopContent.online) {
        emailTopMarkup = emailTopContent.custom.body.markup;
    }
    var orderModel = new OrderModel(order, { countryCode: currentLocale.country, containerView: 'order' });

    var orderObject = {
        order: orderModel,
        markup: emailMarkup,
        topmarkup:emailTopMarkup,
        content: emailContentHelpers.getEmailContent('normal-footer','email-header')
    };

    var emailObj = {
        to: order.customerEmail,
        subject: Resource.msg('subject.order.fail.email', 'order', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.orderConfirmation
    };

    emailHelpers.sendEmail(emailObj, 'checkout/failOrder/failOrderEmail', orderObject);
}

/**
 * Attempts to create an order from the current basket
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {dw.order.Order} The order object created from the current basket
 */
function createOrder(currentBasket) {
    var order;
    try {
        order = Transaction.wrap(function () {
            order = OrderMgr.createOrder(currentBasket);
            order.custom.emailRecommendationPids = 'custom' in currentBasket && 'emailRecommendationPids' in currentBasket.custom && currentBasket.custom.emailRecommendationPids ? currentBasket.custom.emailRecommendationPids : null;
            return order;
        });
    } catch (error) {
        return error;
    }
    return order;
}

/**
 * Copies information from the shipping form to the associated shipping address
 * @param {object} shippingData - the shipping data
 * @param {dw.order.Shipment} [shipmentOrNull] - the target Shipment
 */
function copyShippingAddressToShipment(shippingData, shipmentOrNull) {
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = shipmentOrNull || currentBasket.defaultShipment;

    var shippingAddress = shipment.shippingAddress;

    Transaction.wrap(function () {
        if (shippingAddress === null) {
            shippingAddress = shipment.createShippingAddress();
        }

        shippingAddress.setFirstName(shippingData.address.firstName);
        shippingAddress.setLastName(shippingData.address.lastName);
        shippingAddress.setAddress1(shippingData.address.address1);
        shippingAddress.setAddress2(shippingData.address.address2);
        shippingAddress.setCity(shippingData.address.city);
        shippingAddress.setPostalCode(shippingData.address.postalCode);
        shippingAddress.setStateCode(shippingData.address.stateCode);
        var countryCode = shippingData.address.countryCode.value ? shippingData.address.countryCode.value : shippingData.address.countryCode;
        shippingAddress.setCountryCode(countryCode);
        shippingAddress.setPhone(shippingData.address.phone);
        if (shippingData.address.district) {
            shippingAddress.custom.district = shippingData.address.district;
        }
        if (shippingData.address.subDistrict) {
            shippingAddress.custom.subDistrict = shippingData.address.subDistrict;
        }
        ShippingHelper.selectShippingMethod(shipment, shippingData.shippingMethod);
    });
}

base.placeOrder = placeOrder;
base.validatePayment = validatePayment;
base.sendConfirmationEmail = sendConfirmationEmail;
base.calculatePaymentTransaction = calculatePaymentTransaction;
base.copyBillingAddressToBasket = copyBillingAddressToBasket;
base.sendFailedOrderEmail = sendFailedOrderEmail;
base.createOrder = createOrder;
base.copyShippingAddressToShipment = copyShippingAddressToShipment;

module.exports = base;
