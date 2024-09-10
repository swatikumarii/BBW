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
var addressData = require('./addressData');
var shippingHelpers = require('./checkout/shipping');

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
            if ($input.val() && $input.val().length === 0) {
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

$(document).ready(function () {
    processInclude(require('./checkout/checkout'));
    var checkoutStage = $('#checkout-main').attr('data-checkout-stage');
    var name = 'paymentError';
    var error = new RegExp(
        '[?&]'.concat(encodeURIComponent(name), '=([^&]*)')
    ).exec(window.location.search);
    if (error || paymentStage || checkoutStage === 'payment') {
        if (error) {
            $('.error-message').show();
            $('.error-message-text').empty().text(decodeURIComponent(error[1]));
        }
        adyenCheckout.renderGenericComponent();
    }
    // processInclude(require('adyen/checkout/billing'));
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
    var intl = intlTelInput(phone, {
        utilsScript: utils,
        showFlags: true,
        strictMode: true,
        showSelectedDialCode: true,
        initialCountry: $('.shipping-form .dialCodeCountry').val(),
        formatOnDisplay: false,
        formatAsYouType: false
    });
    // Attach the instance to a global variable
    window.itiInstance = intl;
    $('.shippingPhoneNumber').on('countrychange', function() {
        var countryData = intl.getSelectedCountryData();
        $('.shipping-form .dialCode').val(countryData.dialCode);
        $('.shipping-form .dialCodeCountry').val(countryData.iso2);
    });

    // country selector on billing address
    var billingDialCode = $('.payment-form .dialCodeCountry').val() || $('.dialCodeCountry').val();
    var billingPhone = document.querySelector('#phoneNumber');
    var billingIntl = intlTelInput(billingPhone, {
        utilsScript: utils,
        showFlags: true,
        strictMode: true,
        showSelectedDialCode: true,
        initialCountry: billingDialCode,
        formatOnDisplay: false,
        formatAsYouType: false
    });
    // Attach the instance to a global variable
    window.billingInstance = billingIntl;
    $('#phoneNumber').on('countrychange', function() {
        var billCountryData = billingIntl.getSelectedCountryData();
        $('.payment-form .dialCode').val(billCountryData.dialCode);
        $('.payment-form .dialCodeCountry').val(billCountryData.iso2);
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
            $this.text('隐藏');
        } else {
            $password.attr('type', 'password');
            $this.text('顯示');
        }
    });

    $('form.shipping-form input, form.shipping-form select').on(
        'input change',
        function () {
            if (
                $('#checkout-main').attr('data-checkout-stage') === 'shipping'
            ) {
                checkFields($('form.shipping-form'));
            }
        }
    );

    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (
                mutation.type === 'attributes' &&
                mutation.attributeName === 'data-checkout-stage'
            ) {
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

    $('body')
        .on('mouseleave', '.info-icon', function () {
            setTimeout(function () {
                $('.info-icon-text').removeClass('d-block');
                $('.info-icon-border-arrow-outline').removeClass('d-block');
                $('.info-icon-border-arrow').removeClass('d-block');
            }, 50);
        })
        .on('mouseenter', '.info-icon', function () {
            $('.info-icon-text').addClass('d-block');
            if ($('.info-icon-text').hasClass('d-none')) {
                $('.info-icon-text').removeClass('d-none');
                $('.info-icon-border-arrow-outline').removeClass('d-none');
                $('.info-icon-border-arrow').removeClass('d-none');
            }
        })
        .on('click', '.info-icon', function () {
            $('.info-icon-text').addClass('d-block');
            $('.info-icon-border-arrow-outline').addClass('d-block');
            $('.info-icon-border-arrow').addClass('d-block');
        })

        .on('click', '.bbwd-tooltip-content-container .close', function () {
            $('.info-icon-text').removeClass('d-block');
            $('.info-icon-border-arrow-outline').removeClass('d-block');
            $('.info-icon-border-arrow').removeClass('d-block');
        });

    if (checkoutStage === 'shipping') {
        var selectedState = $('body')
            .find('.shippingState')
            .attr('data-selected');
        if (selectedState !== 'null') {
            var stateShipExists = false;
            $('.shippingState option').each(function () {
                if ($(this).val() === selectedState) {
                    $('.shippingState option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.shippingState').trigger('change');
                    stateShipExists = true;
                    return false;
                }
            });
            if (!stateShipExists) {
                var shippingState = $('.shippingState');
                shippingState.empty();
                shippingState
                    .prepend(
                        $('<option>', {
                            value: selectedState,
                            text: selectedState
                        })
                    )
                    .attr('selected', 'selected');
            }
        }
        var selectedCity = $('body')
            .find('.shippingAddressCity')
            .attr('data-selected');
        if (selectedCity !== 'null') {
            var cityShipExists = false;
            $('.shippingAddressCity option').each(function () {
                if ($(this).val() === selectedCity) {
                    $('.shippingAddressCity option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.shippingAddressCity').trigger('change');
                    return false;
                }
            });
            if (!cityShipExists) {
                var shippingAddressCity = $('.shippingAddressCity');
                shippingAddressCity.empty();
                shippingAddressCity
                    .prepend(
                        $('<option>', {
                            value: selectedCity,
                            text: selectedCity
                        })
                    )
                    .attr('selected', 'selected');
                $('.shippingAddressCity').removeClass('is-invalid');
            }
        }
    }

    if (checkoutStage === 'payment') {
        var selectedBillingState = $('body')
            .find('.billingState')
            .attr('data-selected');
        if (selectedBillingState !== 'null') {
            var stateBillExists = false;
            $('.billingState option').each(function () {
                if ($(this).val() === selectedBillingState) {
                    $('.billingState option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.billingState').trigger('change');
                    stateBillExists = true;
                    return false;
                }
            });
            if (!stateBillExists) {
                var billingState = $('.billingState');
                billingState.empty();
                billingState
                    .prepend(
                        $('<option>', {
                            value: selectedBillingState,
                            text: selectedBillingState
                        })
                    )
                    .attr('selected', 'selected');
                $('.billingState').removeClass('is-invalid');
            }

        }
        var selectedBillingCity = $('body')
            .find('.billingAddressCity')
            .attr('data-selected');
        if (selectedBillingCity !== 'null') {
            var cityExists = false;
            $('.billingAddressCity option').each(function () {
                if ($(this).val() === selectedBillingCity) {
                    $('.billingAddressCity option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.billingAddressCity').trigger('change');
                    cityExists = true;
                    return false;
                }
            });
            if (!cityExists) {
                var suburbDropdown = $('.billingAddressCity');
                suburbDropdown.empty();
                suburbDropdown.prepend(
                    $('<option>', {
                        value: selectedBillingCity,
                        text: selectedBillingCity
                    }).attr('selected', 'selected')
                );
                $('.billingAddressCity').removeClass('is-invalid');
            }
        }
    }
    $.spinner().stop();
});

$(window).on('load', function () {
    $('form.billing-form input, form.billing-form select').on(
        'input change',
        function () {
            if ($('#checkout-main').attr('data-checkout-stage') === 'payment') {
                checkFields($('form.billing-form'));
            }
        }
    );
});

$('.info-icon-text .close').on('click', function () {
    $('.info-icon-text').addClass('d-none');
    $('.info-icon-border-arrow-outline').addClass('d-none');
    $('.info-icon-border-arrow').addClass('d-none');
});

$(document)
    .on('mouseleave', '.promo-details', function () {
        setTimeout(function () {
            $('.promo-details-tooltip').removeClass('d-block');
        }, 50);
    })
    .on('mouseenter', '.promo-details', function () {
        var tooltip = $(this)
            .closest('.promo-details-wrap')
            .find('.promo-details-tooltip');
        tooltip.addClass('d-block');
    });

$('.promo-details-tooltip .close').on('click', function () {
    $('.promo-details-tooltip').addClass('d-none');

    setTimeout(function () {
        $('.promo-details-tooltip').removeClass('d-none');
    }, 300);
});

$(document).on(
    'click',
    '#paymentMethodsList .paymentMethod, .payment-method-options .afterpay-tab',
    function (event) {
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
        $('.payment-method-options')
            .find('[type="radio"]')
            .prop('checked', false);
        $('.additionalFields').css('display', 'none');
        $(event.target)
            .closest('.paymentMethod, .afterpay-tab')
            .find('[type="radio"]')
            .prop('checked', true)
            .trigger('change');
        $(event.target)
            .closest('.paymentMethod, .afterpay-tab')
            .find('.additionalFields')
            .css('display', 'block');
        if (
            $(
                '#paymentMethodsList .paymentMethod [type="radio"]:checked'
            ).val() === 'applepay' &&
            (!($('#contactEmail').val() || '').length ||
                !$('#contactEmail').attr('pattern') ||
                !(new RegExp($('#contactEmail').attr('pattern') || '').test(
                    $('#contactEmail').val() || ''
                )))
        ) {
            $('#component_applepay button').attr('disabled', 'disabled');
            $('#contactEmail').trigger('change');
            var element = $('#contactEmail');
            var position = element && element.length ? element.offset().top : 0;
            $('html, body').animate(
                {
                    scrollTop: position - 250
                },
                500
            );
        }
    }
);
$(document).on('input', '#contactEmail', function () {
    if (
        ($('#contactEmail').val() || '').length &&
        (!$('#contactEmail').attr('pattern') ||
            new RegExp($('#contactEmail').attr('pattern') || '').test(
                $('#contactEmail').val() || ''
            ))
    ) {
        $('#component_applepay button').removeAttr('disabled');
    } else if (
        $('#paymentMethodsList .paymentMethod [type="radio"]:checked').val() ===
        'applepay'
    ) {
        $('#component_applepay button').attr('disabled', 'disabled');
    }
});

$('button.submit-payment').on('click', function () {
    if ($('#selectedPaymentOption').val() === 'AdyenComponent') {
        if (
            [
                'paypal',
                'paywithgoogle',
                'googlepay',
                'amazonpay',
                'applepay',
                'cashapp'
            ].indexOf(
                $(
                    '#paymentMethodsList .paymentMethod [type="radio"]:checked'
                ).val()
            ) === -1
        ) {
            $('#paymentMethodsList .paymentMethod [type="radio"]:checked')
                .closest('.paymentMethod')
                .trigger('click');
        }
    }
});

$('.shippingState').change(function () {
    var selectedState = $(this).val();
    var suburbDropdown = $('.shippingAddressCity');
    suburbDropdown.empty(); // clear existing options

    if (addressData[selectedState]) {
        suburbDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City ----'
            }).attr('selected', 'selected')
        );
        $.each(addressData[selectedState], function (suburb) {
            suburbDropdown.append(
                $('<option>', {
                    value: addressData[selectedState][suburb],
                    text: addressData[selectedState][suburb]
                })
            );
        });
        suburbDropdown.trigger('change');
    } else {
        suburbDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select State First----'
            }).attr('selected', 'selected')
        );
        suburbDropdown.trigger('change');
    }
    var updateShippingMethodsURL = $('input[name="update-shipping-method-url"]').val() + '?stateCode=' + selectedState;
    $.ajax({
        type: 'POST',
        url: updateShippingMethodsURL,
        success: function (data) {
            shippingHelpers.methods.updateShippingMethods(data.order.shipping);
            $('.grand-total-wrap .grand-total').empty().text(data.order.priceTotal);
            if (data.isOrderShippable) {
                $('.cart-dangerous-goods').addClass('d-none');
            } else {
                $('.cart-dangerous-goods').removeClass('d-none');
            }
        }
    });
});


$('.billingState').change(function () {
    var selectedState = $(this).val();
    var suburbDropdown = $('.billingAddressCity');

    suburbDropdown.empty(); // clear existing options

    if (addressData[selectedState]) {
        suburbDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City ----'
            }).attr('selected', 'selected')
        );
        $.each(addressData[selectedState], function (suburb) {
            suburbDropdown.append(
                $('<option>', {
                    value: addressData[selectedState][suburb],
                    text: addressData[selectedState][suburb]
                })
            );
        });
        suburbDropdown.trigger('change');
    } else {
        suburbDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select State First----'
            }).attr('selected', 'selected')
        );
        suburbDropdown.trigger('change');
    }
});

$('.skipToPayment').on('click', function (e) {
    e.preventDefault();
    $('.submit-shipping').click();
});
