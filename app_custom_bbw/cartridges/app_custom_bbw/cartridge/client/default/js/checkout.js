'use strict';

var processInclude = require('base/util');
var intlTelInput = require('intl-tel-input');
var utils = require('utils.js');
var adyenCheckout = require('adyen/adyenCheckout');
var addressAutocomplete = require('./checkout/addressAutocomplete');
// Compatibility Adyen SFRA 5.x.x & 6.x.x
var checkout =
    window.AdyenSFRA6Enabled !== 'null'
        ? require('adyen/checkout/checkoutSFRA6')
        : require('adyen/checkout/checkoutSFRA5');
/* eslint-disable prefer-regex-literals */
var paymentStage = new RegExp('[?&]stage=payment([^&]*)').exec(
    window.location.search
);

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
    processInclude(checkout);
    $('#selectedPaymentOption').val(
        $('.payment-options .nav-item .active').parent().attr('data-method-id')
    );
    google.maps.event.addDomListener(window, 'load', addressAutocomplete.initialize);
    var phone = document.querySelector('.shippingPhoneNumber');
    intlTelInput(phone, {
        utilsScript: utils,
        showFlags: true,
        showSelectedDialCode: true,
        initialCountry: 'au'
    });

    $('.accordion-title').click(function () {
        $(this).next('.accordion-content').slideToggle();
        $(this).toggleClass('rotate-down');
    });

    $('.form-control').blur(function () {
        var $this = $(this);
        var $errorMessage = $this.next('.invalid-feedback');
        if ($this[0].checkValidity()) {
            $errorMessage.hide();
            $this.removeClass('is-invalid');
        } else {
            var errorText;
            if ($this.val().length === 0 ) {
                errorText = $this.data('missing-error');
            } else {
                errorText = $this.data('pattern-mismatch');
            }
            $errorMessage.text(errorText).show(); // Use the title attribute or customize the message
        }
    });

    $('.toggle-password').on('click', function () {
        var $this = $(this);
        var $password = $this.siblings('#password');
        if ($password.attr('type') === 'password') {
            $password.attr('type','text');
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
