"use strict";

var server = require("server");
server.extend(module.superModule);

/**
 * create order function is used to create an order in case of eGHL payment
 * @param  {Object} req place order request
 * @param  {Object} res place order response
 */
function createOrder(req, res) {
    var BasketMgr = require("dw/order/BasketMgr");
    var OrderMgr = require("dw/order/OrderMgr");
    var Resource = require("dw/web/Resource");
    var Transaction = require("dw/system/Transaction");
    var URLUtils = require("dw/web/URLUtils");
    var logger = require("dw/system/Logger").getLogger("eghl");
    var basketCalculationHelpers = require("*/cartridge/scripts/helpers/basketCalculationHelpers");
    var hooksHelper = require("*/cartridge/scripts/helpers/hooks");
    var COHelpers = require("*/cartridge/scripts/checkout/checkoutHelpers");
    var addressHelpers = require("*/cartridge/scripts/helpers/addressHelpers");
    var eghlHelper = require("*/cartridge/scripts/helpers/eghlHelper");
    var eGHLPreference = require("*/cartridge/scripts/service/eGHLPreference");
    var currentBasket = BasketMgr.getCurrentBasket();

    if (req.session.privacyCache.get("fraudDetectionStatus")) {
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url("Error-ErrorCode", "err", "01").toString(),
            errorMessage: Resource.msg("error.technical", "checkout", null),
        });

        this.emit("route:Complete", req, res);
        return;
    }

    // Validate order status
    var validationOrderStatus = hooksHelper(
        "app.validate.order",
        "validateOrder",
        currentBasket,
        require("*/cartridge/scripts/hooks/validateOrder").validateOrder
    );
    if (validationOrderStatus.error) {
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message,
        });
        this.emit("route:Complete", req, res);
        return;
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress == null) {
        res.json({
            error: true,
            errorStage: {
                stage: "shipping",
                step: "address",
            },
            errorMessage: Resource.msg("error.no.shipping.address", "checkout", null),
        });
        this.emit("route:Complete", req, res);
        return;
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: "payment",
                step: "billingAddress",
            },
            errorMessage: Resource.msg("error.no.billing.address", "checkout", null),
        });
        this.emit("route:Complete", req, res);
        return;
    }

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Re-validates existing payment instruments
    var validPayment = COHelpers.validatePayment(req, currentBasket);
    if (validPayment.error) {
        res.json({
            error: true,
            errorStage: {
                stage: "payment",
                step: "paymentInstrument",
            },
            errorMessage: Resource.msg("error.payment.not.valid", "checkout", null),
        });
        this.emit("route:Complete", req, res);
        return;
    }

    // Creates a new order.
    var order = COHelpers.createOrder(currentBasket);

    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg("error.technical", "checkout", null),
        });
        this.emit("route:Complete", req, res);
        return;
    }

    // Store payment transaction data;
    var paymentTransaction = order.paymentInstrument.getPaymentTransaction();
    // generate PaymentId
    var paymentId = eghlHelper.generatePaymentId(order.orderNo);
    Transaction.wrap(function () {
        paymentTransaction.paymentInstrument.custom.eghlPaymentId = paymentId;
        paymentTransaction.paymentInstrument.custom.eghlPaymentMethod =
            eGHLPreference.paymentMethod;
    });

    // Handles payment authorization
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
    if (handlePaymentResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg("error.technical", "checkout", null),
        });
        this.emit("route:Complete", req, res);
        return;
    }

    var fraudDetectionStatus = hooksHelper(
        "app.fraud.detection",
        "fraudDetection",
        currentBasket,
        require("*/cartridge/scripts/hooks/fraudDetection").fraudDetection
    );
    if (fraudDetectionStatus.status == "fail") {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });

        // fraud detection failed
        req.session.privacyCache.set("fraudDetectionStatus", true);

        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url(
                "Error-ErrorCode",
                "err",
                fraudDetectionStatus.errorCode
            ).toString(),
            errorMessage: Resource.msg("error.technical", "checkout", null),
        });

        this.emit("route:Complete", req, res);
        return;
    }

    // Added condition to not save shipping addresses in case of store pickup
    if (
        !currentBasket.defaultShipment.shippingMethod.custom.storePickupEnabled &&
        req.currentCustomer.addressBook
    ) {
        // save all used shipping addresses to address book of the logged in customer
        var allAddresses = addressHelpers.gatherShippingAddresses(order);
        allAddresses.forEach(function (address) {
            if (
                !addressHelpers.checkIfAddressStored(
                    address,
                    req.currentCustomer.addressBook.addresses
                )
            ) {
                addressHelpers.saveAddress(
                    address,
                    req.currentCustomer,
                    addressHelpers.generateAddressName(address)
                );
            }
        });
    }

    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set("usingMultiShipping", false);

    // Generate eGHL redirect URL
    var continueUrl = eghlHelper.generateEghlPaymentUrl(order, paymentId);
    logger.error("EGHL:Order is created with continue url {0}", continueUrl);
    res.json({
        error: false,
        continueUrl: continueUrl,
        isEghl: true,
    });
}

/**
 * CheckoutService-SubmitPayment : This endpoint is invoked to submit the payment
 * @name Base/CheckoutService-SubmitPayment
 * @function
 * @memberof CheckoutService
 * @param {category} - sensitive
 * @param {serverfunction} - prepend
 */

server.prepend("SubmitPayment", function (req, res, next) {
    var paymentForm = server.forms.getForm("billing");
    var paymentMethodId = paymentForm.paymentMethod.htmlValue;

    // If payment method is eGHL then we will replace the base catridge route
    if (paymentMethodId == "EGHL") {
        var Resource = require("dw/web/Resource");
        var PaymentManager = require("dw/order/PaymentMgr");
        var HookManager = require("dw/system/HookMgr");
        var BasketMgr = require("dw/order/BasketMgr");
        var Transaction = require("dw/system/Transaction");
        var COHelpers = require("*/cartridge/scripts/checkout/checkoutHelpers");
        var URLUtils = require("dw/web/URLUtils");
        var basketCalculationHelpers = require("*/cartridge/scripts/helpers/basketCalculationHelpers");
        var validationHelpers = require("*/cartridge/scripts/helpers/basketValidationHelpers");

        var viewData = {};

        // fraud detection
        if (req.session.privacyCache.get("fraudDetectionStatus")) {
            res.json({
                error: true,
                cartError: true,
                redirectUrl: URLUtils.url("Error-ErrorCode", "err", "01").toString(),
                errorMessage: Resource.msg("error.technical", "checkout", null),
            });

            this.emit("route:Complete", req, res);
            return;
        }

        // verify billing form data
        var billingFormErrors = COHelpers.validateBillingForm(
            paymentForm.addressFields
        );
        var contactInfoFormErrors = COHelpers.validateFields(
            paymentForm.contactInfoFields
        );

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
              countryCode: { value: paymentForm.addressFields.country.value },
              subDistrict: { value: paymentForm.addressFields.subDistrict.value },
            };

            if (
                Object.prototype.hasOwnProperty.call(
                    paymentForm.addressFields,
                    "states"
                )
            ) {
                viewData.address.stateCode = {
                    value: paymentForm.addressFields.states.stateCode.value,
                };
            }
        }

        if (Object.keys(contactInfoFormErrors).length) {
            formFieldErrors.push(contactInfoFormErrors);
        } else {
            viewData.email = {
                value: paymentForm.contactInfoFields.email.value,
            };

            viewData.phone = { value: paymentForm.contactInfoFields.phone.value };
        }

        var paymentMethodIdValue = paymentForm.paymentMethod.value;
        if (
            !PaymentManager.getPaymentMethod(paymentMethodIdValue).paymentProcessor
        ) {
            throw new Error(
                Resource.msg("error.payment.processor.missing", "checkout", null)
            );
        }

        var paymentProcessor =
            PaymentManager.getPaymentMethod(
                paymentMethodIdValue
            ).getPaymentProcessor();

        var paymentFormResult;
        if (
            HookManager.hasHook(
                "app.payment.form.processor." + paymentProcessor.ID.toLowerCase()
            )
        ) {
            paymentFormResult = HookManager.callHook(
                "app.payment.form.processor." + paymentProcessor.ID.toLowerCase(),
                "processForm",
                req,
                paymentForm,
                viewData
            );
        } else {
            paymentFormResult = HookManager.callHook(
                "app.payment.form.processor.default_form_processor",
                "processForm"
            );
        }

        if (paymentFormResult.error && paymentFormResult.fieldErrors) {
            formFieldErrors.push(paymentFormResult.fieldErrors);
        }

        if (formFieldErrors.length || paymentFormResult.serverErrors) {
            // respond with form data and errors
            res.json({
                form: paymentForm,
                fieldErrors: formFieldErrors,
                serverErrors: paymentFormResult.serverErrors
                    ? paymentFormResult.serverErrors
                    : [],
                error: true,
            });
            this.emit("route:Complete", req, res);
            return;
        }

        var currentBasket = BasketMgr.getCurrentBasket();

        var billingData = viewData;

        if (!currentBasket) {
            delete billingData.paymentInformation;
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url("Cart-Show").toString(),
            });
            this.emit("route:Complete", req, res);
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
                redirectUrl: URLUtils.url("Cart-Show").toString(),
            });
            this.emit("route:Complete", req, res);
            return;
        }

        var billingAddress = currentBasket.billingAddress;
        var billingForm = server.forms.getForm("billing");
        var paymentMethodID = billingData.paymentMethod.value;
        var result;

        billingForm.creditCardFields.cardNumber.htmlValue = "";
        billingForm.creditCardFields.securityCode.htmlValue = "";

        Transaction.wrap(function () {
            if (!billingAddress) {
                billingAddress = currentBasket.createBillingAddress();
            }

            billingAddress.setFirstName(billingData.address.firstName.value);
            billingAddress.setLastName(billingData.address.lastName.value);
            billingAddress.setAddress1(billingData.address.address1.value);
            billingAddress.setAddress2(billingData.address.address2.value);
            billingAddress.setCity(billingData.address.city.value);
            var subDistrictString = JSON.stringify(
              billingData.address.subDistrict
            );
            if (billingAddress.custom) {
              billingAddress.custom.subDistrict =
                JSON.parse(subDistrictString).value;
            }
            billingAddress.setPostalCode(billingData.address.postalCode.value);
            billingAddress.custom.subDistrict =
              billingData.address.subDistrict.value;
            billingAddress.setPostalCode(billingData.address.postalCode.value);
            if (
                Object.prototype.hasOwnProperty.call(billingData.address, "stateCode")
            ) {
                billingAddress.setStateCode(billingData.address.stateCode.value);
            }
            billingAddress.setCountryCode(billingData.address.countryCode.value);

            billingAddress.setPhone(billingData.phone.value);
            currentBasket.setCustomerEmail(billingData.email.value);
        });

        // if there is no selected payment option and balance is greater than zero
        if (!paymentMethodID && currentBasket.totalGrossPrice.value > 0) {
            var noPaymentMethod = {};

            noPaymentMethod[billingData.paymentMethod.htmlName] = Resource.msg(
                "error.no.selected.payment.method",
                "payment",
                null
            );

            delete billingData.paymentInformation;

            res.json({
                form: billingForm,
                fieldErrors: [noPaymentMethod],
                serverErrors: [],
                error: true,
            });
            this.emit("route:Complete", req, res);
            return;
        }

        var processor =
            PaymentManager.getPaymentMethod(paymentMethodID).getPaymentProcessor();

        // check to make sure there is a payment processor
        if (!processor) {
            throw new Error(
                Resource.msg("error.payment.processor.missing", "checkout", null)
            );
        }

        if (
            HookManager.hasHook("app.payment.processor." + processor.ID.toLowerCase())
        ) {
            result = HookManager.callHook(
                "app.payment.processor." + processor.ID.toLowerCase(),
                "Handle",
                currentBasket,
                billingData.paymentInformation,
                paymentMethodID,
                req
            );
        } else {
            result = HookManager.callHook("app.payment.processor.default", "Handle");
        }

        // need to invalidate credit card fields
        if (result.error) {
            delete billingData.paymentInformation;

            res.json({
                form: billingForm,
                fieldErrors: result.fieldErrors,
                serverErrors: result.serverErrors,
                error: true,
            });
            this.emit("route:Complete", req, res);
            return;
        }

        // Calculate the basket
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        // Re-calculate the payments.
        var calculatedPaymentTransaction =
            COHelpers.calculatePaymentTransaction(currentBasket);

        if (calculatedPaymentTransaction.error) {
            res.json({
                form: paymentForm,
                fieldErrors: [],
                serverErrors: [Resource.msg("error.technical", "checkout", null)],
                error: true,
            });
            this.emit("route:Complete", req, res);
            return;
        }
        // set value in session
        session.privacy.addressBook = !!req.currentCustomer.addressBook;
        session.privacy.saveAddress = paymentForm.saveAddress.value;
        session.privacy.billingDialCode = paymentForm.addressFields.dialCode.value;
        session.privacy.billingDialCodeCountry = paymentForm.addressFields.dialCodeCountry.value;

        // If everything is okay then  create the order and redirect merchant to eGHL portal
        createOrder(req, res);

        this.emit("route:Complete", req, res);
        return;
    }
    next();
});

module.exports = server.exports();
