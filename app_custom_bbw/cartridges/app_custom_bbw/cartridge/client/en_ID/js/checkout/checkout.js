'use strict';

var customerHelpers = require('base/checkout/customer');
var addressHelpers = require('base/checkout/address');
var shippingHelpers = require('./shipping');
var billingHelpers = require('./billing');
var summaryHelpers = require('./summary');
var formHelpers = require('./formErrors');
var location = window.location;
var history = window.history;

/**
 * checks if any required field is empty
 * @param {object} form - current form
 */
function checkFields(form) {
    var requiredFields = $(form).find('[required]');
    var allFilled = true;
    requiredFields.each(function () {
        var isGftcardField = $(this).parents('.gift-card-apply').length > 0;
        var isPaymentField = $(this).parents('#paymentMethodsList').length > 0;
        if (
            !($(this).val() && $(this).val().trim()) &&
            !isGftcardField &&
            !isPaymentField
        ) {
            allFilled = false;
        }
    });
    if (allFilled) {
        $('.verify-msg').hide();
    } else {
        $('.verify-msg').show();
    }
}

/**
 * @returns {boolean} True is valid else False
 */
function validateEmail() {
    var emailInput = $('#email');
    var pattern = /^[\w.%+-]+@[\w.-]+\.\w{2,}$/i;
    if (!emailInput.val()) {
        emailInput.addClass('is-invalid'); // Add class for input border error
        $('#emailInvalidMessage').html(emailInput.data('missing-error'));
        $('#emailInvalidMessage').css('display', 'block');
        return false;
    }
    if (!pattern.test(emailInput.val())) {
        emailInput.addClass('is-invalid'); // Add class for input border error
        $('#emailInvalidMessage').html(emailInput.data('pattern-mismatch'));
        $('#emailInvalidMessage').css('display', 'block');
        return false;
    }
    $('#emailInvalidMessage').css('display', 'none');
    emailInput.removeClass('is-invalid'); // Remove class if input is valid
    return true;
}

/**
 * @returns {boolean} True is valid else False
 */
function validatePassword() {
    var passwordInput = $('#password');
    if (!passwordInput.val()) {
        passwordInput.addClass('is-invalid'); // Add class for input border error
        $('#passwordInvalidMessage').html(passwordInput.data('missing-error'));
        $('#passwordInvalidMessage').css('display', 'block');
        return false;
    }
    $('#passwordInvalidMessage').css('display', 'none');
    passwordInput.removeClass('is-invalid'); // Remove class if input is valid
    return true;
}

/**
 * @returns {boolean} True is valid else False
 */
function validateLoginForm() {
    var isValid = true;
    if (!validatePassword()) {
        isValid = false;
    }
    if (!validateEmail()) {
        isValid = false;
    }
    return isValid;
}

$(document).on('blur', '#password', function () {
    validatePassword();
});

$(document).on('blur', '#email', function () {
    validateEmail();
});

/**
 *
 * @param {string} orderID - Order ID
 */
function ovoStart(orderID) {
    $('.ovoPayPopup').removeClass('d-none');
    $('.ovoPayPopup .ovo-popup span').text(orderID);
}

/**
 * Create the jQuery Checkout Plugin.
 *
 * This jQuery plugin will be registered on the dom element in checkout.isml with the
 * id of "checkout-main".
 *
 * The checkout plugin will handle the different state the user interface is in as the user
 * progresses through the varying forms such as shipping and payment.
 *
 * Billing info and payment info are used a bit synonymously in this code.
 * @param {object} $ jquery object
 */
(function ($) {
    $.fn.checkout = function () { // eslint-disable-line
        var plugin = this;

        //
        // Collect form data from user input
        //
        var formData = {
            // Customer Data
            customer: {},

            // Shipping Address
            shipping: {},

            // Billing Address
            billing: {},

            // Payment
            payment: {},

            // Gift Codes
            giftCode: {}
        };

        //
        // The different states/stages of checkout
        //
        var checkoutStages = [
            'customer',
            'shipping',
            'payment'
        ];

        /**
         * Updates the URL to determine stage
         * @param {number} currentStage - The current stage the user is currently on in the checkout
         */
        function updateUrl(currentStage) {
            history.pushState(
                checkoutStages[currentStage],
                document.title,
                location.pathname
                + '?stage='
                + checkoutStages[currentStage]
                + '#'
                + checkoutStages[currentStage]
            );
        }

        //
        // Local member methods of the Checkout plugin
        //
        var members = {

            // initialize the currentStage variable for the first time
            currentStage: 0,

            /**
             * Set or update the checkout stage (AKA the shipping, billing, payment, etc... steps)
             * @returns {object} a promise
             */
            updateStage: function () {
                var stage = checkoutStages[members.currentStage];
                var defer = $.Deferred(); // eslint-disable-line
                $('input:radio[name=paymentMethod]:first').attr('checked', true);
                if (stage === 'customer') {
                    //
                    // Clear Previous Errors
                    //
                    customerHelpers.methods.clearErrors();

                    if (validateLoginForm()) {
                        //
                        // Submit the Customer Form
                        //
                        var customerFormSelector = customerHelpers.methods.isGuestFormActive() ? customerHelpers.vars.GUEST_FORM : customerHelpers.vars.REGISTERED_FORM;
                        var customerForm = $(customerFormSelector);
                        $.spinner().start();
                        $.ajax({
                            url: customerForm.attr('action'),
                            type: 'post',
                            data: customerForm.serialize(),
                            success: function (data) {
                                $.spinner().stop();
                                if (data.error) {
                                    $('#form-error').html(data.customerErrorMessage);
                                    $('.form-error-div').removeClass('d-none');
                                } else if (data.redirectUrl) {
                                    window.location.href = data.redirectUrl;
                                } else {
                                    $('#form-error').html('');
                                    $('.form-error-div').addClass('d-none');
                                    customerHelpers.methods.customerFormResponse(defer, data);
                                }
                            },
                            error: function (err) {
                                if (err.responseJSON && err.responseJSON.redirectUrl) {
                                    window.location.href = err.responseJSON.redirectUrl;
                                }
                                // Server error submitting form
                                defer.reject(err.responseJSON);
                                $.spinner().stop();
                            }
                        });
                    }
                    return defer;
                } if (stage === 'shipping') {
                    //
                    // Clear Previous Errors
                    //
                    formHelpers.clearPreviousErrors('.shipping-form');

                    //
                    // Submit the Shipping Address Form
                    //
                    var isMultiShip = $('#checkout-main').hasClass('multi-ship');
                    var formSelector = isMultiShip
                        ? '.multi-shipping .active form' : '.single-shipping .shipping-form';
                    var form = $(formSelector);

                    if (isMultiShip && form.length === 0) {
                        // disable the next:Payment button here
                        $('body').trigger('checkout:disableButton', '.next-step-button button');
                        // in case the multi ship form is already submitted
                        var url = $('#checkout-main').attr('data-checkout-get-url');
                        $.spinner().start();
                        $.ajax({
                            url: url,
                            method: 'GET',
                            success: function (data) {
                                $.spinner().stop();
                                // enable the next:Payment button here
                                $('body').trigger('checkout:enableButton', '.next-step-button button');
                                if (!data.error) {
                                    $('body').trigger(
                                        'checkout:updateCheckoutView',
                                        { order: data.order, customer: data.customer }
                                    );
                                    defer.resolve();
                                } else if (data.message && $('.shipping-error .alert-danger').length < 1) {
                                    var errorMsg = data.message;
                                    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error '
                                        + 'fade show" role="alert">'
                                        + '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'
                                        + '<span aria-hidden="true">&times;</span>'
                                        + '</button>' + errorMsg + '</div>';
                                    $('.shipping-error').append(errorHtml);
                                    scrollAnimate($('.shipping-error'));
                                    defer.reject();
                                } else if (data.redirectUrl) {
                                    window.location.href = data.redirectUrl;
                                }
                            },
                            error: function () {
                                // enable the next:Payment button here
                                $('body').trigger('checkout:enableButton', '.next-step-button button');
                                // Server error submitting form
                                defer.reject();
                                $.spinner().stop();
                            }
                        });
                    } else {
                        var shippingFormData = form.serialize();

                        $('body').trigger('checkout:serializeShipping', {
                            form: form,
                            data: shippingFormData,
                            callback: function (data) {
                                shippingFormData = data;
                            }
                        });
                        // disable the next:Payment button here
                        $('body').trigger('checkout:disableButton', '.next-step-button button');
                        $.spinner().start();
                        $.ajax({
                            url: form.attr('action'),
                            type: 'post',
                            data: shippingFormData,
                            success: function (data) {
                                // enable the next:Payment button here
                                $('body').trigger('checkout:enableButton','.next-step-button button');
                                if (data.error) {
                                    shippingHelpers.methods.shippingFormResponse(
                                        defer,
                                        data
                                    );
                                    $.spinner().stop();
                                } else {
                                    // enable the next:Payment button here
                                    var billingURL = $('input[name="billing-url"]').val();
                                    window.location.href = billingURL;
                                }
                            },
                            error: function (err) {
                                // enable the next:Payment button here
                                $('body').trigger('checkout:enableButton', '.next-step-button button');
                                if (err.responseJSON && err.responseJSON.redirectUrl) {
                                    window.location.href = err.responseJSON.redirectUrl;
                                }
                                // Server error submitting form
                                defer.reject(err.responseJSON);
                                $.spinner().stop();
                            }
                        });
                    }
                    return defer;
                } if (stage === 'payment') {
                    //
                    // Submit the Billing Address Form
                    //

                    formHelpers.clearPreviousErrors('.payment-form');

                    var billingAddressForm = $(
                        '#dwfrm_billing .billing-address-block :input'
                    ).serialize();
                    var billingForm = $('form.billing-form');
                    checkFields(billingForm);

                    $('body').trigger('checkout:serializeBilling', {
                        form: $('#dwfrm_billing .billing-address-block'),
                        data: billingAddressForm,
                        callback: function (data) {
                            if (data) {
                                billingAddressForm = data;
                            }
                        }
                    });

                    var contactInfoForm = $('#dwfrm_billing .contact-info-block :input').serialize();

                    $('body').trigger('checkout:serializeBilling', {
                        form: $('#dwfrm_billing .contact-info-block'),
                        data: contactInfoForm,
                        callback: function (data) {
                            if (data) {
                                contactInfoForm = data;
                            }
                        }
                    });

                    var activeTabId = $('.tab-pane.active').attr('id');
                    var paymentInfoSelector = '#dwfrm_billing .' + activeTabId + ' .payment-form-fields :input';
                    var paymentInfoForm = $(paymentInfoSelector).serialize();

                    $('body').trigger('checkout:serializeBilling', {
                        form: $(paymentInfoSelector),
                        data: paymentInfoForm,
                        callback: function (data) {
                            if (data) {
                                paymentInfoForm = data;
                            }
                        }
                    });

                    var paymentForm = billingAddressForm + '&' + contactInfoForm + '&' + paymentInfoForm;
                    var isovo = false;
                    isovo = $(paymentInfoSelector).each(function () {
                        if ($(this).val() === 'ovo') {
                            return true;
                        }
                    });
                    if (isovo) {
                        var ovoID = $('#dwfrm_billing #ovoID').serialize();
                        $('body').trigger('checkout:serializeBilling', {
                            form: $('#dwfrm_billing #ovoID'),
                            data: ovoID,
                            callback: function (data) {
                                if (data) {
                                    ovoID = data;
                                }
                            }
                        });
                        paymentForm = billingAddressForm + '&' + contactInfoForm + '&' + paymentInfoForm + '&' + ovoID;
                    }

                    // disable the next:Place Order button here
                    $('body').trigger('checkout:disableButton', '.next-step-button button');
                    $.spinner().start();
                    $.ajax({
                        url: $('#dwfrm_billing').attr('action'),
                        method: 'POST',
                        data: paymentForm,
                        success: function (data) {
                            $.spinner().stop();
                            // enable the next:Place Order button here
                            // $('body').trigger('checkout:enableButton', '.next-step-button button');
                            // look for field validation errors
                            if (data.error) {
                                if (data.fieldErrors.length) {
                                    if ($('.summary-details.billing').is(':visible')) {
                                        $('.edit-billing-address').click();
                                    }
                                    data.fieldErrors.forEach(function (error) {
                                        if (Object.keys(error).length) {
                                            formHelpers.loadFormErrors('.payment-form', error);
                                        }
                                    });
                                }

                                if (data.serverErrors.length) {
                                    data.serverErrors.forEach(function (error) {
                                        $('.error-message').show();
                                        $('.error-message-text').empty().append(error);
                                        scrollAnimate($('.error-message'));
                                    });
                                }

                                if (data.cartError) {
                                    window.location.href = data.redirectUrl;
                                }

                                defer.reject();
                            } else {

                                if ('continueUrl' in data && 'isDoku' in data && data.isDoku) {
                                    window.location.href = data.continueUrl;
                                } else if (data.isEgiftCardPayment && data.isThankYouPage) {
                                    var redirect = $('<form>').appendTo(document.body).attr({
                                        method: 'POST',
                                        action: data.continueUrl
                                    });
                                    $('<input>').appendTo(redirect).attr({
                                        name: 'orderID',
                                        value: data.orderID
                                    });
                                    $('<input>').appendTo(redirect).attr({
                                        name: 'orderToken',
                                        value: data.orderToken
                                    });
                                    redirect.submit();
                                    defer.resolve(data);
                                } else if ('continueUrl' in data && 'isEgiftCardPayment' in data && data.isEgiftCardPayment) {
                                    var continueUrl = data.continueUrl;
                                    var urlParams = {
                                        ID: data.orderID,
                                        token: data.orderToken
                                    };

                                    continueUrl += (continueUrl.indexOf('?') !== -1 ? '&' : '?') +
                                         Object.keys(urlParams).map(function (key) {
                                             return key + '=' + encodeURIComponent(urlParams[key]);
                                         }).join('&');

                                    window.location.href = continueUrl;
                                    defer.resolve(data);
                                } else if ('continueUrl' in data && 'isovo' in data && data.isovo) {
                                    var reqOrder = data.reqOrder;
                                    ovoStart(reqOrder.invoice_number);
                                    $.spinner().stop();
                                    $.ajax({
                                        url: data.continueUrl,
                                        method: 'POST',
                                        data: reqOrder,
                                        success: function (dataOvo) {
                                            window.location.href = dataOvo.continue;
                                        },
                                        error: function (err) {
                                            // enable the next:Place Order button here
                                            $('body').trigger('checkout:enableButton', '.next-step-button button');
                                            // ovoStop();
                                            if (err.responseJSON && err.responseJSON.redirectUrl) {
                                                window.location.href = err.responseJSON.redirectUrl;
                                            }
                                        }
                                        // timeout: 70000
                                    });
                                }
                                defer.resolve(data);
                            }
                        },
                        error: function (err) {
                            // enable the next:Place Order button here
                            $('body').trigger('checkout:enableButton', '.next-step-button button');
                            if (err.responseJSON && err.responseJSON.redirectUrl) {
                                window.location.href = err.responseJSON.redirectUrl;
                            }
                        }
                    });

                    return defer;
                } if (stage === 'placeOrder') {
                    // disable the placeOrder button here
                    $('body').trigger('checkout:disableButton', '.next-step-button button');
                    $.spinner().start();
                    $.ajax({
                        url: $('.place-order').data('action'),
                        method: 'POST',
                        success: function (data) {
                            // enable the placeOrder button here
                            $('body').trigger('checkout:enableButton', '.next-step-button button');
                            if (data.error) {
                                if (data.cartError) {
                                    window.location.href = data.redirectUrl;
                                    defer.reject();
                                } else {
                                    // go to appropriate stage and display error message
                                    defer.reject(data);
                                }
                                $.spinner().stop();
                            } else {
                                var redirect = $('<form>')
                                    .appendTo(document.body)
                                    .attr({
                                        method: 'POST',
                                        action: data.continueUrl
                                    });

                                $('<input>')
                                    .appendTo(redirect)
                                    .attr({
                                        name: 'orderID',
                                        value: data.orderID
                                    });

                                $('<input>')
                                    .appendTo(redirect)
                                    .attr({
                                        name: 'orderToken',
                                        value: data.orderToken
                                    });

                                redirect.submit();
                                defer.resolve(data);
                            }
                        },
                        error: function () {
                            // enable the placeOrder button here
                            $('body').trigger('checkout:enableButton', $('.next-step-button button'));
                            $.spinner().stop();
                        }
                    });

                    return defer;
                }
                var p = $('<div>').promise(); // eslint-disable-line
                setTimeout(function () {
                    p.done(); // eslint-disable-line
                }, 500);
                return p; // eslint-disable-line
            },

            /**
             * Initialize the checkout stage.
             *
             * TODO: update this to allow stage to be set from server?
             */
            initialize: function () {
                // set the initial state of checkout
                members.currentStage = checkoutStages
                    .indexOf($('.data-checkout-stage').data('checkout-stage'));
                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);

                $('body').on('click', '.submit-customer-login', function (e) {
                    e.preventDefault();
                    members.currentStage = checkoutStages.indexOf('customer');
                    members.nextStage();
                    members.currentStage = checkoutStages.indexOf('shipping');
                });
                $('body').on('click', '.submit-customer', function (e) {
                    e.preventDefault();
                    members.nextStage();
                });

                //
                // Handle Payment option selection
                //
                $('input[name$="paymentMethod"]', plugin).on('change', function () {
                    $('.credit-card-form').toggle($(this).val() === 'CREDIT_CARD');
                });

                //
                // Handle Next State button click
                //
                $(plugin).on('click', '.next-step-button button', function () {
                    members.nextStage();
                });

                //
                // Handle Edit buttons on shipping and payment summary cards
                //
                $('.customer-summary .edit-button', plugin).on('click', function () {
                    members.gotoStage('customer');
                });

                $('.shipping-summary .edit-button', plugin).on('click', function () {
                    if (!$('#checkout-main').hasClass('multi-ship')) {
                        $('body').trigger('shipping:selectSingleShipping');
                    }

                    members.gotoStage('shipping');
                });

                $('.payment-summary .edit-button', plugin).on('click', function () {
                    members.gotoStage('payment');
                });

                //
                // remember stage (e.g. shipping)
                //
                updateUrl(members.currentStage);

                //
                // Listen for foward/back button press and move to correct checkout-stage
                //
                $(window).on('popstate', function (e) {
                    //
                    // Back button when event state less than current state in ordered
                    // checkoutStages array.
                    //
                    if (e.state === null
                        || checkoutStages.indexOf(e.state) < members.currentStage) {
                        members.handlePrevStage(false);
                    } else if (checkoutStages.indexOf(e.state) > members.currentStage) {
                        // Forward button  pressed
                        members.handleNextStage(false);
                    }
                });

                //
                // Set the form data
                //
                plugin.data('formData', formData);
            },

            /**
             * The next checkout state step updates the css for showing correct buttons etc...
             */
            nextStage: function () {
                var promise = members.updateStage();

                promise.done(function () {
                    // Update UI with new stage
                    $('.error-message').hide();
                    members.handleNextStage(true);
                });

                promise.fail(function (data) {
                    // show errors
                    if (data) {
                        if (data.errorStage) {
                            members.gotoStage(data.errorStage.stage);

                            if (data.errorStage.step === 'billingAddress') {
                                var $billingAddressSameAsShipping = $(
                                    'input[name$="_shippingAddressUseAsBillingAddress"]'
                                );
                                if ($billingAddressSameAsShipping.is(':checked')) {
                                    $billingAddressSameAsShipping.prop('checked', false);
                                }
                            }
                        }

                        if (data.errorMessage) {
                            $('.error-message').show();
                            $('.error-message-text').empty().append(data.errorMessage);
                        }
                    }
                });
            },

            /**
             * The next checkout state step updates the css for showing correct buttons etc...
             * @param {boolean} bPushState - boolean when true pushes state using the history api.
             */
            handleNextStage: function (bPushState) {
                if (members.currentStage < checkoutStages.length - 1) {
                    // move stage forward
                    members.currentStage++;

                    //
                    // show new stage in url (e.g.payment)
                    //
                    if (bPushState) {
                        updateUrl(members.currentStage);
                    }
                }

                // Set the next stage on the DOM
                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
            },

            /**
             * Previous State
             */
            handlePrevStage: function () {
                if (members.currentStage > 1) {
                    // move state back
                    members.currentStage--;
                    updateUrl(members.currentStage);
                } else {
                    history.back();
                }

                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
            },

            /**
             * Use window history to go to a checkout stage
             * @param {string} stageName - the checkout state to goto
             */
            gotoStage: function (stageName) {
                members.currentStage = checkoutStages.indexOf(stageName);
                updateUrl(members.currentStage);
                $(plugin).attr('data-checkout-stage', checkoutStages[members.currentStage]);
            }
        };

        //
        // Initialize the checkout
        //
        members.initialize();

        return this;
    };
}(jQuery));

var exports = {
    initialize: function () {
        $('#checkout-main').checkout();
    },

    updateCheckoutView: function () {
        $('body').on('checkout:updateCheckoutView', function (e, data) {
            if (data.csrfToken) {
                $('input[name*=\'csrf_token\']').val(data.csrfToken);
            }
            customerHelpers.methods.updateCustomerInformation(data.customer, data.order);
            shippingHelpers.methods.updateMultiShipInformation(data.order);
            summaryHelpers.updateTotals(data.order.totals);
            data.order.shipping.forEach(function (shipping) {
                shippingHelpers.methods.updateShippingInformation(
                    shipping,
                    data.order,
                    data.customer,
                    data.options
                );
            });
            billingHelpers.methods.updateBillingInformation(
                data.order,
                data.customer,
                data.options
            );
            billingHelpers.methods.updatePaymentInformation(data.order, data.options);
            summaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
        });
    },

    disableButton: function () {
        $('body').on('checkout:disableButton', function (e, button) {
            $(button).prop('disabled', true);
        });
    },

    enableButton: function () {
        $('body').on('checkout:enableButton', function (e, button) {
            $(button).prop('disabled', false);
        });
    }

};

[customerHelpers, billingHelpers, shippingHelpers, addressHelpers].forEach(function (library) {
    Object.keys(library).forEach(function (item) {
        if (typeof library[item] === 'object') {
            exports[item] = $.extend({}, exports[item], library[item]);
        } else {
            exports[item] = library[item];
        }
    });
});

module.exports = exports;
