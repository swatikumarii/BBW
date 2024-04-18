'use strict';

var processInclude = require('base/util');
var adyenCheckout = require('adyen/adyenCheckout');
// Compatibility Adyen SFRA 5.x.x & 6.x.x
var checkout =
    window.AdyenSFRA6Enabled !== 'null'
        ? require('adyen/checkout/checkoutSFRA6')
        : require('adyen/checkout/checkoutSFRA5');

$(document).ready(function () {
    var name = 'paymentError';
    var error = new RegExp(
        '[?&]'.concat(encodeURIComponent(name), '=([^&]*)')
    ).exec(window.location.search);
    /* eslint-disable prefer-regex-literals */
    var paymentStage = new RegExp('[?&]stage=payment([^&]*)').exec(
        window.location.search
    );
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
});
$('.payment-options .nav-link').click(function setAttr() {
    $('#selectedPaymentOption').val($(this).parent().attr('data-method-id'));
});
