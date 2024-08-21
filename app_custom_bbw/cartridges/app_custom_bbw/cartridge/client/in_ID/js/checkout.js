'use strict';

var processInclude = require('base/util');
var intlTelInput = require('intl-tel-input');
var utils = require('utils.js');
var addressAutocomplete = require('./checkout/addressAutocomplete');
/* eslint-disable prefer-regex-literals */
var paymentStage = new RegExp('[?&]stage=payment([^&]*)').exec(
    window.location.search
);
var addressData = require('./addressData');

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
        // eslint-disable-next-line
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
        $('.next-step-button button').removeAttr('disabled');
    } else {
        $('.verify-msg').show();
    }
}

$(document).on(
    'click',
    '#paymentMethodsList .paymentMethod, .payment-method-options .tab-pane',
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
        $('#paymentMethodsList .paymentMethod, .payment-method-options .tab-pane').removeClass('active');
        $(this).addClass('active');
        $('#selectedPaymentOption').val(paymentMethod);
        $('.payment-method-options')
            .find('[type="radio"]')
            .prop('checked', false);
        $('.additionalFields').css('display', 'none');
        $(event.target)
            .closest('.paymentMethod, .tab-pane')
            .find('[type="radio"]')
            .prop('checked', true)
            .trigger('change');
        $(event.target)
            .closest('.paymentMethod, .tab-pane')
            .find('.additionalFields')
            .css('display', 'block');
    }
);

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
            $('.error-message-text').text(decodeURIComponent(error[1]));
        }
    }
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
        initialCountry: 'id',
        countryOrder: ['id'],
        formatAsYouType: false
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
            $this.text('Bersembunyi');
        } else {
            $password.attr('type', 'password');
            $this.text('Menunjukkan');
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
        // eslint-disable-next-line
        if (selectedState !== 'null') {
            $('.shippingState option').each(function () { // eslint-disable-line
                if ($(this).val() === selectedState) {
                    $('.shippingState option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.shippingState').trigger('change');
                    return false;
                }
            });
        }
        var selectedCity = $('body')
            .find('.shippingAddressCity')
            .attr('data-selected');
        if (selectedCity !== 'null') {
            $('.shippingAddressCity option').each(function () { // eslint-disable-line
                if ($(this).val() === selectedCity) {
                    $('.shippingAddressCity option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.shippingAddressCity').trigger('change');
                    return false;
                }
            });
        }

        var selectedDistrict = $('body')
            .find('.shippingAddressDistrict')
            .attr('data-selected');
        if (selectedDistrict !== 'null') {
            $('.shippingAddressDistrict option').each(function () { // eslint-disable-line
                if ($(this).val() === selectedDistrict) {
                    $('.shippingAddressDistrict option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.shippingAddressDistrict').trigger('change');
                    return false;
                }
            });
        }

        var selectedSubDistrict = $('body')
            .find('.shippingAddressSubdistrict')
            .attr('data-selected');
        if (selectedSubDistrict !== 'null') {
            $('.shippingAddressSubdistrict option').each(function () { // eslint-disable-line
                if ($(this).val() === selectedSubDistrict) {
                    $('.shippingAddressSubdistrict option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body')
                        .find('.shippingAddressSubdistrict')
                        .trigger('change');
                    return false;
                }
            });
        }

        var selectedPostalCode = $('body')
            .find('.shippingZipCode')
            .attr('data-selected');
        if (selectedPostalCode !== 'null') {
            $('.shippingZipCode option').each(function () { // eslint-disable-line
                if ($(this).val() === selectedPostalCode) {
                    $('.shippingZipCode option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.shippingZipCode').trigger('change');
                    return false;
                }
            });
        }
    }

    if (checkoutStage === 'payment') {
        var selectedBillingState = $('body')
            .find('.billingState')
            .attr('data-selected');
        if (selectedBillingState !== 'null') {
            $('.billingState option').each(function () { // eslint-disable-line
                if ($(this).val() === selectedBillingState) {
                    $('.billingState option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.billingState').trigger('change');
                    return false;
                }
            });
        }
        var selectedBillingCity = $('body')
            .find('.billingAddressCity')
            .attr('data-selected');
        if (selectedBillingCity !== 'null') {
            $('.billingAddressCity option').each(function () { // eslint-disable-line
                if ($(this).val() === selectedBillingCity) {
                    $('.billingAddressCity option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.billingAddressCity').trigger('change');
                    return false;
                }
            });
        }
        var selectedBillingDistrict = $('body')
            .find('.billingAddressDistrict')
            .attr('data-selected');
        if (selectedBillingDistrict !== 'null') {
            $('.billingAddressDistrict option').each(function () { // eslint-disable-line
                if ($(this).val() === selectedBillingDistrict) {
                    $('.billingAddressDistrict option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.billingAddressDistrict').trigger('change');
                    return false;
                }
            });
        }
        var selectedBillingSubDistrict = $('body')
            .find('.billingAddressSubdistrict')
            .attr('data-selected');
        if (selectedBillingSubDistrict !== 'null') {
            $('.billingAddressSubdistrict option').each(function () { // eslint-disable-line
                if ($(this).val() === selectedBillingSubDistrict) {
                    $('.billingAddressSubdistrict option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.billingAddressSubdistrict').trigger('change');
                    return false;
                }
            });
        }

        var selectedBillingPostalCode = $('body')
            .find('.billingZipCode')
            .attr('data-selected');
        // eslint-disable-next-line
        if (selectedBillingPostalCode !== 'null') {
            $('.billingZipCode option').each(function () { // eslint-disable-line
                if ($(this).val() === selectedBillingPostalCode) {
                    $('.billingZipCode option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.billingZipCode').trigger('change');
                    return false;
                }
            });
        }
        var billingForm = $('#dwfrm_billing .contact-info-block');
        if (!$('input[name$=_phone]', billingForm).val()) {
            var isMultiShip = $('#checkout-main').hasClass('multi-ship');
            var formSelector = isMultiShip ? '.multi-shipping .active form' : '.single-shipping .shipping-form';
            var shippingForm = $(formSelector);
            $('input[name$=_phone]', billingForm).val($('input[name$=_phone]', shippingForm).val());
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


$('.shippingState').change(function () {
    var selectedState = $(this).val();
    var suburbDropdown = $('.shippingAddressCity');
    var zipDropdown = $('.shippingZipCode');
    suburbDropdown.empty(); // clear existing options

    if (addressData[selectedState]) {
        suburbDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City ----'
            }).attr('selected', 'selected')
        );
        zipDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Zip Code ----'
            }).attr('selected', 'selected')
        );
        $.each(addressData[selectedState], function (suburb) {
            suburbDropdown.append(
                $('<option>', {
                    value: suburb,
                    text: suburb
                })
            );
        });
        suburbDropdown.trigger('change');
        zipDropdown.trigger('change');
    } else {
        suburbDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select State First----'
            }).attr('selected', 'selected')
        );
        suburbDropdown.trigger('change');
        zipDropdown.trigger('change');
    }
});

$('.shippingAddressCity').change(function () {
    var selectedState = $('.shippingState').val();
    var selectedSuburb = $(this).val();
    var districtDropdown = $('.shippingAddressDistrict');
    districtDropdown.empty(); // clear existing options

    if (addressData[selectedState] && addressData[selectedState][selectedSuburb])
    {
        districtDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select District ----'
            }).attr('selected', 'selected')
        );
        var districtMappingObj = addressData[selectedState][selectedSuburb];
        $.each(Object.keys(districtMappingObj), function (district) {
            districtDropdown.append(
                $('<option>', {
                    value: Object.keys(districtMappingObj)[district],
                    text: Object.keys(districtMappingObj)[district]
                })
            );
        });
        districtDropdown.trigger('change');
    } else {
        $(this).val('');
        districtDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City First----'
            }).attr('selected', 'selected')
        );
        districtDropdown.trigger('change');
    }
});

$('.shippingAddressDistrict').change(function () {
    var selectedState = $('.shippingState').val();
    var selectedSuburb = $('.shippingAddressCity').val();
    var selectedDistrict = $(this).val();
    var subDistrictDropdown = $('.shippingAddressSubdistrict');
    var zipDropdown = $('.shippingZipCode');
    subDistrictDropdown.empty(); // clear existing options
    zipDropdown.empty(); // clear existing options

    if (
        addressData[selectedState] &&
        addressData[selectedState][selectedSuburb] &&
        addressData[selectedState][selectedSuburb][selectedDistrict]
    ) {
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Sub District ----'
            }).attr('selected', 'selected')
        );
        zipDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Zip Code ----'
            }).attr('selected', 'selected')
        );
        var districtMappingObj =
            addressData[selectedState][selectedSuburb][selectedDistrict];
        districtMappingObj.subDistrict.forEach((subDistrict) => {
            subDistrictDropdown.append(
                $('<option>', {
                    value: subDistrict,
                    text: subDistrict
                })
            );
        });
        districtMappingObj.zipcode.forEach((zip) => {
            zipDropdown.append(
                $('<option>', {
                    value: zip,
                    text: zip
                })
            );
        });
        subDistrictDropdown.trigger('change');
    } else {
        $(this).val('');
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select District First----'
            }).attr('selected', 'selected')
        );
        zipDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select District First----'
            }).attr('selected', 'selected')
        );
    }
});

$('.shippingZipCode').change(function () {
    var selectedZipCode = $(this).val();
    if (selectedZipCode === null) {
        $(this).val('').change();
    }
});

$('.billingState').change(function () {
    var selectedState = $(this).val();
    var suburbDropdown = $('.billingAddressCity');
    var zipDropdown = $('.billingZipCode');

    suburbDropdown.empty(); // clear existing options

    if (addressData[selectedState]) {
        suburbDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City ----'
            }).attr('selected', 'selected')
        );
        zipDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Zip Code ----'
            }).attr('selected', 'selected')
        );
        $.each(addressData[selectedState], function (suburb) {
            suburbDropdown.append(
                $('<option>', {
                    value: suburb,
                    text: suburb
                })
            );
        });
        suburbDropdown.trigger('change');
        zipDropdown.trigger('change');
    } else {
        suburbDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select State First----'
            }).attr('selected', 'selected')
        );
        suburbDropdown.trigger('change');
        zipDropdown.trigger('change');
    }
});

$('.billingAddressCity').change(function () {
    var selectedState = $('.billingState').val();
    var selectedSuburb = $(this).val();
    var districtDropdown = $('.billingAddressDistrict');
    districtDropdown.empty(); // clear existing options

    if (
        addressData[selectedState] &&
        addressData[selectedState][selectedSuburb]
    ) {
        districtDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Zip Code ----'
            }).attr('selected', 'selected')
        );
        var districtMappingObj = addressData[selectedState][selectedSuburb];
        $.each(Object.keys(districtMappingObj), function (district) {
            districtDropdown.append(
                $('<option>', {
                    value: Object.keys(districtMappingObj)[district],
                    text: Object.keys(districtMappingObj)[district]
                })
            );
        });
        districtDropdown.trigger('change');
    } else {
        $(this).val('');
        districtDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City First----'
            }).attr('selected', 'selected')
        );
        districtDropdown.trigger('change');
    }
});

$('.billingAddressDistrict').change(function () {
    var selectedState = $('.billingState').val();
    var selectedSuburb = $('.billingAddressCity').val();
    var selectedDistrict = $(this).val();
    var subDistrictDropdown = $('.billingAddressSubdistrict');
    var zipDropdown = $('.billingZipCode');
    subDistrictDropdown.empty(); // clear existing options
    zipDropdown.empty(); // clear existing options

    if (
        addressData[selectedState] &&
        addressData[selectedState][selectedSuburb] &&
        addressData[selectedState][selectedSuburb][selectedDistrict]
    ) {
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Sub District ----'
            }).attr('selected', 'selected')
        );
        zipDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Zip Code ----'
            }).attr('selected', 'selected')
        );
        var districtMappingObj =
            addressData[selectedState][selectedSuburb][selectedDistrict];
        districtMappingObj.subDistrict.forEach((subDistrict) => {
            subDistrictDropdown.append(
                $('<option>', {
                    value: subDistrict,
                    text: subDistrict
                })
            );
        });
        districtMappingObj.zipcode.forEach((zip) => {
            zipDropdown.append(
                $('<option>', {
                    value: zip,
                    text: zip
                })
            );
        });
        subDistrictDropdown.trigger('change');
    } else {
        $(this).val('');
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select District First----'
            }).attr('selected', 'selected')
        );
        zipDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select District First----'
            }).attr('selected', 'selected')
        );
    }
});

$('.billingZipCode').change(function () {
    var selectedZipCode = $(this).val();
    if (selectedZipCode === null) {
        $(this).val('').change();
    }
});

$('.skipToPayment').on('click', function (e) {
    e.preventDefault();
    $('.submit-shipping').click();
});
