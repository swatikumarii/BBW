'use strict';

var server = require('server');

server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var URLUtils = require('dw/web/URLUtils');

/**
 *  Handle Ajax payment (and billing) form submit
 */
server.prepend('SubmitPayment', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var BasketMgr = require('dw/order/BasketMgr');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    var isGiftProductAvailable = qwikcilverHelpers.validateGiftProduct(currentBasket);
    if (currentBasket) {
        var paymentForm = server.forms.getForm('billing');
        var contactInfoFormErrors = COHelpers.validateFields(
            paymentForm.contactInfoFields
        );
        var formFieldErrors = [];
        if (Object.keys(contactInfoFormErrors).length) {
            formFieldErrors.push(contactInfoFormErrors);
        } else {
            Transaction.wrap(function () {
                currentBasket.setCustomerEmail(
                    paymentForm.contactInfoFields.email.value
                );
            });
        }
        if (isGiftProductAvailable && paymentForm) {
            COHelpers.copyShippingAddressToShipment({
                address: {
                    firstName: paymentForm.addressFields.firstName.value,
                    lastName: paymentForm.addressFields.lastName.value,
                    address1: paymentForm.addressFields.address1.value,
                    address2: paymentForm.addressFields.address2.value,
                    city: paymentForm.addressFields.city.value,
                    postalCode: paymentForm.addressFields.postalCode.value,
                    stateCode: paymentForm.addressFields.states.stateCode.value,
                    countryCode: paymentForm.addressFields.country.value,
                    phone: paymentForm.addressFields.phone.value,
                    dialCode: paymentForm.addressFields.dialCode.value,
                    dialCodeCountry: paymentForm.addressFields.dialCodeCountry.value
                }
            }, null);
        }
        // set value in session
        session.privacy.addressBook = !!req.currentCustomer.addressBook;
        session.privacy.saveAddress = paymentForm.saveAddress.value;
        session.privacy.billingDialCode = paymentForm.addressFields.dialCode.value;
        session.privacy.billingDialCodeCountry = paymentForm.addressFields.dialCodeCountry.value;
    }

    next();
});

server.append(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var currentBasket = BasketMgr.getCurrentBasket();
        if (currentBasket) {
            var paymentForm = server.forms.getForm('billing');
            this.on('route:BeforeComplete', function () {
                Transaction.wrap(function () {
                    // this function will not work in case of google pay, after pay
                    if (currentBasket.billingAddress) {
                        currentBasket.billingAddress.custom.dialCode = paymentForm.addressFields.dialCode.value;
                        currentBasket.billingAddress.custom.dialCodeCountry = paymentForm.addressFields.dialCodeCountry.value;
                    }
                });
            });
        }

        next();
    }
);

/**
 * Validates the given form and creates response JSON if there are errors.
 * @param {string} form - the customer form to validate
 * @returns {object} validation result
 */
function validateCustomerForm(form) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var result = COHelpers.validateCustomerForm(form);

    if (result.formFieldErrors.length) {
        result.customerForm.clear();
        // prepare response JSON with form data and errors
        result.json = {
            form: result.customerForm,
            fieldErrors: result.formFieldErrors,
            serverErrors: [],
            error: true
        };
    }

    return result;
}

/**
 * Handle Ajax registered customer form submit.
 */
server.prepend(
    'LoginCustomer',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Resource = require('dw/web/Resource');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

        // validate registered customer form
        var coRegisteredCustomerForm = server.forms.getForm('coRegisteredCustomer');
        var result = validateCustomerForm(coRegisteredCustomerForm);
        if (result.json) {
            res.json(result.json);
            return next();
        }

        // login the registered customer
        var customerForm = result.customerForm;
        var formFieldErrors = result.formFieldErrors;

        if (accountHelpers.handleMigratedCustomers(customerForm.email.value)) {
            res.json({
                form: customerForm,
                fieldErrors: formFieldErrors,
                serverErrors: [],
                customerErrorMessage: Resource.msgf(
                    'reset.password.message.migrated.user',
                    'login',
                    null,
                    URLUtils.url('Account-PasswordReset')
                ),
                error: true
            });
            return this.emit('route:Complete', req, res);
        }
        return next();
    }
);

/**
 * CheckoutServices-LoginCustomer : The CheckoutServices-LoginCustomer endpoint.
 */
server.append('LoginCustomer', function (req, res, next) {
    var viewData = res.getViewData();
    if (viewData.error) {
        var Resource = require('dw/web/Resource');
        var accountHelper = require('*/cartridge/scripts/helpers/accountHelpers');
        var email = viewData.form.email.value;
        var remainingLoginAttempts =
            accountHelper.remainingLoginAttempts(email);
        if (remainingLoginAttempts === 'USER_NOT_FOUND') {
            viewData.customerErrorMessage = Resource.msg(
                'error.message.username.password.does.not.match',
                'login',
                null
            );
        } else if (remainingLoginAttempts !== -1) {
            viewData.customerErrorMessage = Resource.msgf(
                'error.message.login.form.attempts',
                'login',
                null,
                remainingLoginAttempts
            );

            if (!remainingLoginAttempts || remainingLoginAttempts === 0) {
                viewData.customerErrorMessage = Resource.msg(
                    'error.message.account.locked',
                    'login',
                    null
                );
            }
            viewData.remainingLoginAttempts = remainingLoginAttempts;
        }
        res.setViewData(viewData);
    }
    next();
});

/**
 * Handle dynamic badges
 */
server.append(
    'LoginCustomer',
    function (req, res, next) {
        var dynamicBadgeHelpers = require('*/cartridge/scripts/helpers/dynamicBadgeHelpers');
        var viewData = res.getViewData();
        if (
            viewData.customerLoginResult &&
            viewData.customerLoginResult.authenticatedCustomer &&
            viewData.customerLoginResult.authenticatedCustomer.profile
        ) {
            dynamicBadgeHelpers.updateCartDetailInProfile(
                viewData.customerLoginResult.authenticatedCustomer.profile
            );
        }
        return next();
    }
);

module.exports = server.exports();
