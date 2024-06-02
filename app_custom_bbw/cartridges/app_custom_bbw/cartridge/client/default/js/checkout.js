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

    $('.place-order-trigger').on('click', function () {
        $('button.place-order').click();
    });
});
$('.payment-options .nav-link').click(function setAttr() {
    $('#selectedPaymentOption').val($(this).parent().attr('data-method-id'));
    if ($(this).parent().attr('data-method-id') === 'AdyenComponent') {
        adyenCheckout.renderGenericComponent();
    } else {
        $('button[value="submit-payment"]').attr('disabled', false);
    }
});
