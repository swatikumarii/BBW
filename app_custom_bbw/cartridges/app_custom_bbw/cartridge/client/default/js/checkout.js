'use strict';

var processInclude = require('base/util');
var intlTelInput = require('intl-tel-input');
var utils = require('utils.js');
var adyenCheckout = require('adyen/adyenCheckout');
var addressAutocomplete = require('./checkout/addressAutocomplete');
/* eslint-disable prefer-regex-literals */
var paymentStage = new RegExp('[?&]stage=payment([^&]*)').exec(
    window.location.search
);

/**
 * validateFields
 * @param {object} $input input field
 */
function validateFields($input) {
    try {

        var $errorMessage = $input.next('.invalid-feedback');
        if ($input[0].checkValidity()) {
            $errorMessage.hide();
            $input.removeClass('is-invalid');
            if ($input.parents('.iti').length)
                $input.parents('.iti').removeClass('is-invalid border-danger');
        } else {
            var errorText;
            if ($input.val().length === 0) {
                errorText = $input.data('missing-error');
            } else {
                errorText = $input.data('pattern-mismatch');
            }
            if ($input.parents('.iti').length)
                $input.parents('.iti').addClass('is-invalid border-danger');
            $errorMessage.text(errorText).show(); // Use the title attribute or customize the message
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * checks if any required field is empty
 * @param {object} form - current form
 */
function checkFields(form) {
    var requiredFields = form.find('[required]');
    var allFilled = true;
    requiredFields.each(function() {
        var isGftcardField= $(this).parents('.gift-card-apply').length > 0;
        var isPaymentField = $(this).parents('#paymentMethodsList').length > 0;
        if (!$(this).val().trim() && !isGftcardField && !isPaymentField) {
            allFilled = false;
        }
    });
    if (allFilled) {
        $('.verify-msg').hide();
    } else {
        $('.verify-msg').show();
    }
}

$(document).ready(function () {
    var name = 'paymentError';
    var error = new RegExp(
        '[?&]'.concat(encodeURIComponent(name), '=([^&]*)')
    ).exec(window.location.search);
    if (error || paymentStage) {
        if (error) {
            $('.error-message').show();
            $('.error-message-text').text(decodeURIComponent(error[1]));
        }
        adyenCheckout.renderGenericComponent();
    }
    processInclude(require('./checkout/checkout'));
    processInclude(require('adyen/checkout/billing'));
    $('#selectedPaymentOption').val(
        $('.payment-options .nav-item .active').parent().attr('data-method-id')
    );
    google.maps.event.addDomListener(
        window,
        'load',
        addressAutocomplete.initialize
    );
    google.maps.event.addDomListener(
        window,
        'load',
        addressAutocomplete.initializeBilling
    );
    var phone = document.querySelector('.shippingPhoneNumber');
    intlTelInput(phone, {
        utilsScript: utils,
        showFlags: true,
        strictMode: true,
        showSelectedDialCode: true,
        initialCountry: 'au',
        countryOrder: ['au']
    });

    $('.accordion-title').click(function () {
        $(this).next('.accordion-content').slideToggle();
        $(this).toggleClass('rotate-down');
    });

    $('.form-control').blur(function () {
        validateFields($(this));
    });

    $('.form-control').on('input change', function () {
        validateFields($(this));
    });

    $('.toggle-password').on('click', function () {
        var $this = $(this);
        var $password = $this.siblings('#password');
        if ($password.attr('type') === 'password') {
            $password.attr('type', 'text');
            $this.text('Hide');
        } else {
            $password.attr('type', 'password');
            $this.text('Show');
        }
    });

    var checkoutStage = $('#checkout-main').attr('data-checkout-stage');
    var form = $('form.shipping-form');
    if (checkoutStage === 'payment') {
        form = $('form.billing-form');
    }
    checkFields(form);
    $('form.shipping-form input, form.shipping-form select').on('input change', function () {
        if ($('#checkout-main').attr('data-checkout-stage') === 'shipping') {
            checkFields($('form.shipping-form'));
        }
    });
    $('form.billing-form input, form.billing-form select').on('input change', function () {
        if ($('#checkout-main').attr('data-checkout-stage') === 'payment') {
            checkFields($('form.billing-form'));
        }
    });

    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-checkout-stage') {
                var newValue = $(mutation.target).attr('data-checkout-stage');
                if (newValue === 'payment') {
                    checkFields($('form.billing-form'));
                }
            }
        });
    });

    var config = { attributes: true, attributeFilter: ['data-checkout-stage'] };

    // Target element to observe
    var target = document.getElementById('checkout-main');

    // Start observing the target element
    observer.observe(target, config);

    $('.place-order-trigger').on('click', function () {
        $('button.place-order').click();
    });
});
$(document).on('click', '#paymentMethodsList .paymentMethod, .payment-method-options .afterpay-tab', function (event) {
    var paymentMethod = $(this)
        .closest('.payment-method-options')
        .data('payment-method-id');
    $('.credit-card-selection-new .tab-pane').removeClass('active');
    $(
        '.credit-card-selection-new [data-payment-method-id="' +
            paymentMethod +
            '"] .tab-pane'
    ).addClass('active');
    $('.payment-options .nav-item .nav-link').removeClass('active');
    $(
        '.payment-options .nav-item.nav-item[data-method-id="' +
            paymentMethod +
            '"] .nav-link'
    ).addClass('active');
    if (paymentMethod !== 'AdyenComponent') {
        $('button[value="submit-payment"]').attr('disabled', false);
    } else if (paymentMethod === 'AdyenComponent') {
        // adyenCheckout.renderGenericComponent();
    }
    $('#selectedPaymentOption').val(paymentMethod);
    $('.payment-method-options').find('[type="radio"]').prop('checked', false);
    $('.additionalFields').css('display', 'none');
    $(event.target)
        .closest('.paymentMethod, .afterpay-tab')
        .find('[type="radio"]')
        .prop('checked', true).trigger('change');
    $(event.target)
        .closest('.paymentMethod, .afterpay-tab')
        .find('.additionalFields')
        .css('display', 'block');
});
