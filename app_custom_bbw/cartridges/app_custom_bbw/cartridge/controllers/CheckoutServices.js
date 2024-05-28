'use strict';

var server = require('server');

server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 *  Handle Ajax payment (and billing) form submit
 */
server.prepend('SubmitPayment', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var BasketMgr = require('dw/order/BasketMgr');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
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
    }

    next();
});

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
                customerErrorMessage: Resource.msg(
                    'reset.password.message.migrated.user',
                    'login',
                    null
                ),
                error: true
            });
            return this.emit('route:Complete', req, res);
        }
        return next();
    }
);

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
