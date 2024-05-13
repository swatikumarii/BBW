'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

var page = module.superModule;
server.extend(page);

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var logger = require('dw/system/Logger').getLogger('qwikcilverServices');
var OrderModel = require('*/cartridge/models/order');
var Locale = require('dw/util/Locale');

/**
 * placeOrder function is responsible to place the gift card orders
 * @param {boolean} req request object
 * @param {boolean} res response object
 * @param {object} next - next
 * Place Gift Card Order
 */
// eslint-disable-next-line no-unused-vars
function placeOrder(req, res, next) {
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    var paymentMethodId = currentBasket.paymentInstrument.paymentMethod;
    if (!currentBasket || currentBasket.productQuantityTotal <= 0) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        this.emit('route:Complete', req, res);
        return;
    }

    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        this.emit('route:Complete', req, res);
        return;
    }

    var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
    if (validationOrderStatus.error) {
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress'
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Creates a new order.
    var order = COHelpers.createOrder(currentBasket);
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Handles payment authorization
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo, paymentMethodId);
    if (handlePaymentResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
    var OrderMgr = require('dw/order/OrderMgr');
    if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });

        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);

        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        this.emit('route:Complete', req, res);
        return;
    }

    // Added condition to not save shipping addresses in case of store pickup
    if (!currentBasket.defaultShipment.shippingMethod.custom.storePickupEnabled && req.currentCustomer.addressBook) {
        // save all used shipping addresses to address book of the logged in customer
        var allAddresses = addressHelpers.gatherShippingAddresses(order);
        allAddresses.forEach(function (address) {
            if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
                addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address));
            }
        });
    }
    // Redeem Qwikcilver Gift Card
    var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
    var giftCardAPIRedeemResult;
    var qwikcilverApis = require('*/cartridge/scripts/service/qwikcilver/apis');

    if (currentBasket.getPaymentInstruments('GIFT_CERTIFICATE').length > 0) {
        giftCardAPIRedeemResult = qwikcilverApis.redeemGiftCards(order);
        if (giftCardAPIRedeemResult && giftCardAPIRedeemResult.status === 'OK' && giftCardAPIRedeemResult.object) {
            var redeemGiftCard = JSON.parse(giftCardAPIRedeemResult.object);
            if (redeemGiftCard.ResponseCode !== 0 && redeemGiftCard.Cards && redeemGiftCard.Cards.length > 0) {
                res.json({
                    error: true,
                    errorMessage: redeemGiftCard.Cards[1].ResponseMessage
                });
                this.emit('route:Complete', req, res);
                return;
            }
        } else if (giftCardAPIRedeemResult && giftCardAPIRedeemResult.errorMessage) {
            if ('status' in giftCardAPIRedeemResult && giftCardAPIRedeemResult.getStatus().equals('SERVICE_UNAVAILABLE')) {
                res.json({
                    error: true,
                    errorMessage: Resource.msg('qwikcilver.service.unavailable', 'qwikcilver', null)
                });
                this.emit('route:Complete', req, res);
                return;
            }
            if (giftCardAPIRedeemResult.msg !== 'Connection reset') {
                var redeemErrorMessageObj = JSON.parse(giftCardAPIRedeemResult.errorMessage);
                res.json({
                    error: true,
                    errorMessage: redeemErrorMessageObj.message
                });
            } else {
                res.json({
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
                this.emit('route:Complete', req, res);
                return;
            }
        }
        if (giftCardAPIRedeemResult.status === 'ERROR') {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            this.emit('route:Complete', req, res);
            return;
        }
    }

    // Places the order
    logger.info('Order is placed from QC checkout servicer {0}', order.orderNo);
    var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }
    if (giftCardAPIRedeemResult.status === 'OK') {
        var redeemedGiftCard = JSON.parse(giftCardAPIRedeemResult.object);
        if (redeemedGiftCard.ResponseCode === 0) {
            qwikcilverHelpers.saveGiftCardDetails(order, redeemedGiftCard, 'Redeemed');
        }
    }

    if (order.getCustomerEmail()) {
        // Send order confirmation email.
        COHelpers.sendConfirmationEmail(order, req.locale.id);
    }
    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);
    var options = {};

    res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString(),
        options: options,
        isThankYouPage: true,
        isEgiftCardPayment: true
    });
}

/**
 *  GiftCard Checkout and Partial checkout with Other Payments
 */
server.prepend('SubmitPayment', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    var Site = require('dw/system/Site');
    var enableQwikcilver = Site.current.getCustomPreferenceValue('enableQwikcilver');
    if (enableQwikcilver) {
        var paymentForm = server.forms.getForm('billing');
        var HookMgr = require('dw/system/HookMgr');
        var PaymentMgr = require('dw/order/PaymentMgr');
        var AccountModel = require('*/cartridge/models/account');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
        var PaymentManager = require('dw/order/PaymentMgr');
        var HookManager = require('dw/system/HookMgr');

        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            this.emit('route:Complete', req, res);
            return;
        }

        // Check pli item shouldn't be a gift Product
        // If Gift Card payment, and non gift product are available in the basket
        // Removed all payment instruments
        var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
        var isGiftProductAvailable = qwikcilverHelpers.validateGiftProduct(currentBasket);

        if (isGiftProductAvailable && currentBasket.getPaymentInstruments('GIFT_CERTIFICATE').length > 0) {
            Transaction.wrap(function () {
                var paymentInstruments = currentBasket.getPaymentInstruments();
                var iterator = paymentInstruments.iterator();
                while (iterator.hasNext()) {
                    var paymentInstrument = iterator.next();
                    currentBasket.removePaymentInstrument(paymentInstrument);
                }
                currentBasket.custom.eGiftTotalAmount = 0;
            });
        }
        var paymentMethodIdValue;
        if (currentBasket.custom.eGiftTotalAmount !== 0 && (currentBasket.custom.eGiftTotalAmount === currentBasket.totalGrossPrice.value)) {
            paymentMethodIdValue = 'GIFT_CERTIFICATE';
        } else {
            paymentMethodIdValue = paymentForm.paymentMethod.value;
        }

        // Remove Payment Instrument except GIFT_CERTIFICATE for Partial Payment
        Transaction.wrap(function () {
            var paymentInstruments = currentBasket.getPaymentInstruments();
            var iterator = paymentInstruments.iterator();
            while (iterator.hasNext()) {
                var paymentInstrument = iterator.next();
                if (paymentInstrument.paymentMethod !== 'GIFT_CERTIFICATE') {
                    currentBasket.removePaymentInstrument(paymentInstrument);
                }
            }
        });
        // Return to next for non gift payment
        if (currentBasket.getPaymentInstruments('GIFT_CERTIFICATE').length === 0 && paymentMethodIdValue !== 'GIFT_CERTIFICATE') {
            next();
            return;
        }

        // verify billing form data
        var viewData = {};
        var billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);
        var contactInfoFormErrors = COHelpers.validateFields(paymentForm.contactInfoFields);

        var formFieldErrors = [];
        if (Object.keys(billingFormErrors).length) {
            formFieldErrors.push(billingFormErrors);
        } else {
            viewData.address = {
                firstName: { value: paymentForm.addressFields.firstName.value },
                lastName: { value: paymentForm.addressFields.lastName.value },
                address1: { value: paymentForm.addressFields.address1.value },
                address2: { value: paymentForm.addressFields.address2.value },
                city: { value: paymentForm.addressFields.city.value },
                postalCode: { value: paymentForm.addressFields.postalCode.value },
                countryCode: { value: paymentForm.addressFields.country.value }
            };

            if (Object.prototype.hasOwnProperty.call(paymentForm.addressFields, 'states')) {
                viewData.address.stateCode = { value: paymentForm.addressFields.states.stateCode.value };
            }
        }

        if (Object.keys(contactInfoFormErrors).length) {
            formFieldErrors.push(contactInfoFormErrors);
        } else {
            Transaction.wrap(function () {
                currentBasket.setCustomerEmail(
                    paymentForm.contactInfoFields.email.value
                );
            });

            viewData.phone = { value: paymentForm.contactInfoFields.phone.value };
        }


        if (formFieldErrors.length) {
            // respond with form data and errors
            res.json({
                form: paymentForm,
                fieldErrors: formFieldErrors,
                error: true
            });
            this.emit('route:Complete', req, res);
            return;
        }

        if (!PaymentManager.getPaymentMethod(paymentMethodIdValue).paymentProcessor) {
            throw new Error(Resource.msg(
                'error.payment.processor.missing',
                'checkout',
                null
            ));
        }

        var paymentProcessor = PaymentManager.getPaymentMethod(paymentMethodIdValue).getPaymentProcessor();

        var paymentFormResult;
        if (paymentMethodIdValue === 'AdyenComponent') {
            if (HookManager.hasHook('app.payment.form.processor.' + paymentProcessor.ID.toLowerCase())) {
                paymentFormResult = HookManager.callHook('app.payment.form.processor.' + paymentProcessor.ID.toLowerCase(),
                    'processForm',
                    req,
                    paymentForm,
                    viewData
                );
            } else {
                paymentFormResult = HookManager.callHook('app.payment.form.processor.default_form_processor', 'processForm');
            }

            if (paymentFormResult.error && paymentFormResult.fieldErrors) {
                formFieldErrors.push(paymentFormResult.fieldErrors);
            }

            if (formFieldErrors.length || paymentFormResult.serverErrors) {
                // respond with form data and errors
                res.json({
                    form: paymentForm,
                    fieldErrors: formFieldErrors,
                    serverErrors: paymentFormResult.serverErrors ? paymentFormResult.serverErrors : [],
                    error: true
                });
                next();
            }
            res.setViewData(paymentFormResult.viewData);
        }

        if (!PaymentManager.getPaymentMethod(paymentMethodIdValue).paymentProcessor) {
            throw new Error(Resource.msg(
                'error.payment.processor.missing',
                'checkout',
                null
            ));
        }

        var billingData = viewData;

        if (!currentBasket) {
            delete billingData.paymentInformation;
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            this.emit('route:Complete', req, res);
            return;
        }

        var validatedProducts = validationHelpers.validateProducts(currentBasket);
        if (validatedProducts.error) {
            delete billingData.paymentInformation;
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            this.emit('route:Complete', req, res);
            return;
        }

        var billingAddress = currentBasket.billingAddress;
        var billingForm = server.forms.getForm('billing');

        billingForm.creditCardFields.cardNumber.htmlValue = '';
        billingForm.creditCardFields.securityCode.htmlValue = '';

        Transaction.wrap(function () {
            if (!billingAddress) {
                billingAddress = currentBasket.createBillingAddress();
            }

            billingAddress.setFirstName(billingData.address.firstName.value);
            billingAddress.setLastName(billingData.address.lastName.value);
            billingAddress.setAddress1(billingData.address.address1.value);
            billingAddress.setAddress2(billingData.address.address2.value);
            billingAddress.setCity(billingData.address.city.value);
            billingAddress.setPostalCode(billingData.address.postalCode.value);
            if (Object.prototype.hasOwnProperty.call(billingData.address, 'stateCode')) {
                billingAddress.setStateCode(billingData.address.stateCode.value);
            }
            billingAddress.setCountryCode(billingData.address.countryCode.value);

            billingAddress.setPhone(billingData.phone.value);
            if (paymentMethodIdValue === 'AFTERPAY' || paymentMethodIdValue === 'CLEARPAY') {
                billingAddress.setPhone(billingForm.addressFields.phone.value);
                currentBasket.setCustomerEmail(paymentForm.contactInfoFields.email.value);
            }
            currentBasket.setCustomerEmail(paymentForm.contactInfoFields.email.value);
        });

        // if there is no selected payment option and balance is greater than zero
        if (!paymentMethodIdValue && currentBasket.totalGrossPrice.value > 0) {
            var noPaymentMethod = {};

            noPaymentMethod[billingData.paymentMethod.htmlName] =
                Resource.msg('error.no.selected.payment.method', 'payment', null);

            delete billingData.paymentInformation;

            res.json({
                form: billingForm,
                fieldErrors: [noPaymentMethod],
                serverErrors: [],
                error: true
            });
            this.emit('route:Complete', req, res);
            return;
        }

        Transaction.wrap(function () {
            HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
        });

        var processor = PaymentMgr.getPaymentMethod(paymentMethodIdValue).getPaymentProcessor();
        if (!processor) {
            throw new Error(Resource.msg('error.payment.processor.missing', 'checkout', null));
        }
        if (paymentMethodIdValue === 'AdyenComponent') {
            paymentForm = paymentFormResult.viewData.paymentInformation;
        }

        var processorResult = null;
        if (HookMgr.hasHook('app.partial.payment.processor.' + processor.ID.toLowerCase())) {
            processorResult = HookMgr.callHook('app.partial.payment.processor.' + processor.ID.toLowerCase(),
                'Handle',
                paymentMethodIdValue,
                currentBasket,
                paymentForm
            );
        } else {
            processorResult = HookMgr.callHook('app.payment.processor.default', 'Handle');
        }
        if (processorResult.error) {
            delete billingForm.paymentInformation;
            res.json({
                form: billingForm,
                fieldErrors: processorResult.fieldErrors,
                serverErrors: processorResult.serverErrors,
                error: true
            });
            this.emit('route:Complete', req, res);
            return;
        }

        var usingMultiShipping = false; // Current integration support only single shpping
        req.session.privacyCache.set('usingMultiShipping', usingMultiShipping);

        var currentLocale = Locale.getLocale(req.locale.id);
        var basketModel = new OrderModel(currentBasket, { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' });
        var accountModel = new AccountModel(req.currentCustomer);

        if (paymentMethodIdValue === 'AdyenComponent') {
            res.json({
                renderedPaymentInstruments: COHelpers.getRenderedPaymentInstruments(req, accountModel),
                customer: accountModel,
                order: basketModel,
                form: billingForm,
                error: false
            });
            this.emit('route:Complete', req, res);
            return;
        }

        if (paymentMethodIdValue === 'GIFT_CERTIFICATE') {
            placeOrder(req, res, next);
            this.emit('route:Complete', req, res);
            return;
        }

        if (paymentMethodIdValue === 'AFTERPAY' || paymentMethodIdValue === 'CLEARPAY') {
            hooksHelper('app.customer.subscription', 'subscribeTo', [paymentForm.subscribe.checked, billingForm.contactInfoFields.email.htmlValue], function () {});

            var redirectUrl = URLUtils.https('AfterpayRedirect-PrepareRedirect').toString();
            var afterPayTokenResponse = require('*/cartridge/scripts/checkout/afterpayGetToken').getToken(currentBasket);
            var countryCode = currentBasket.billingAddress.countryCode ? currentBasket.billingAddress.countryCode.value.toUpperCase() : '';

            res.json({
                error: false,
                redirectTokenResponse: afterPayTokenResponse,
                countryCode: countryCode,
                customer: accountModel,
                redirectUrl: redirectUrl,
                afterpayEnabled: true
            });
            this.emit('route:Complete', req, res);
        }
    } else {
        next();
    }
});

module.exports = server.exports();
