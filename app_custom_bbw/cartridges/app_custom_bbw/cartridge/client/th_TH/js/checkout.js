'use strict';

var processInclude = require('base/util');
var intlTelInput = require('intl-tel-input');
var utils = require('utils.js');
var addressAutocomplete = require('./checkout/addressAutocomplete');
/* eslint-disable prefer-regex-literals */
var paymentStage = new RegExp('[?&]stage=payment([^&]*)').exec(
    window.location.search
);
var addressDataEN = require('./addressDataEN');
var addressDataNativeLocale = require('./addressData');
var addressData;
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
        var regPattern = $input.prop('pattern');
        if (regPattern) {
            var regEx = new RegExp(regPattern);
            if (regEx.test($input.val()) || $input.val().length === 0) {
                $errorMessage.hide();
                $input.removeClass('is-invalid');
            } else {
                $errorMessage.show();
                var patternErrorText = $input.data('pattern-mismatch');
                $errorMessage.text(patternErrorText).show(); // Use the title attribute or customize the message
            }
        }
    } catch (error) {
        console.log(error); // eslint-disable-line
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
        $(
            '#paymentMethodsList .paymentMethod, .payment-method-options .tab-pane'
        ).removeClass('active');
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
    var shippingState = $('body').find('.shippingState');
    var selectedState = shippingState.attr('data-selected');
    if (addressDataNativeLocale[selectedState]) {
        addressData = addressDataNativeLocale;
    } else {
        addressData = addressDataEN;
    }
    shippingState.trigger('change');
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
    $('.shippingPhoneNumber').on('countrychange', function () {
        var countryData = intl.getSelectedCountryData();
        $('.shipping-form .dialCode').val(countryData.dialCode);
        $('.shipping-form .dialCodeCountry').val(countryData.iso2);
    });

    // country selector on billing address
    var billingDialCode =
        $('.payment-form .dialCodeCountry').val() ||
        $('.dialCodeCountry').val();
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
    $('#phoneNumber').on('countrychange', function () {
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
            $this.text('ซ่อน');
        } else {
            $password.attr('type', 'password');
            $this.text('แสดง');
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
        selectedState = shippingState.attr('data-selected');
        if (selectedState !== 'null') {
            var stateShipExists = false;
            $('.shippingState option').each(function () {
                if ($(this).val() === selectedState) {
                    $('.shippingState option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    stateShipExists = true;
                    return false;
                }
            });
            if (!stateShipExists) {
                shippingState
                    .prepend(
                        $('<option>', {
                            value: selectedState,
                            text: selectedState
                        })
                    )
                    .attr('selected', 'selected');
            }
            $('.shippingState').trigger('change');
        }
        var selectedCity = $('body')
            .find('.shippingAddressCity')
            .attr('data-selected');
        if (selectedCity !== 'null') {
            var cityShipExists = false;
            var shippingAddressCity = $('body').find('.shippingAddressCity');
            $('.shippingAddressCity option').each(function () {
                if ($(this).val() === selectedCity) {
                    cityShipExists = true;
                    $('.shippingAddressCity option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    return false;
                }
            });
            if (!cityShipExists) {
                shippingAddressCity.prepend(
                    $('<option>', {
                        value: selectedCity,
                        text: selectedCity
                    }).attr('selected', 'selected')
                );
                shippingAddressCity.removeClass('is-invalid');
            }
            shippingAddressCity.trigger('change');
        }
        var selectedSubDistrict = $('body')
            .find('.shippingAddressSubdistrict')
            .attr('data-selected');
        if (selectedSubDistrict !== 'null') {
            var subDistrictShipExits = false;
            $('.shippingAddressSubdistrict option').each(function () {
                // eslint-disable-line
                if ($(this).val() === selectedSubDistrict) {
                    $('.shippingAddressSubdistrict option').removeAttr(
                        'selected'
                    );
                    $(this).attr('selected', 'selected');
                    subDistrictShipExits = true;
                    return false;
                }
            });
            if (!subDistrictShipExits) {
                var subDistricShiptDropdown = $('.shippingAddressSubdistrict');
                subDistricShiptDropdown.prepend(
                    $('<option>', {
                        value: selectedSubDistrict,
                        text: selectedSubDistrict
                    }).attr('selected', 'selected')
                );
                $('.shippingAddressSubdistrict').removeClass('is-invalid');
            }
            $('body').find('.shippingAddressSubdistrict').trigger('change');
        }
    }

    if (checkoutStage === 'payment') {
        var billingState = $('body').find('.shippingState');
        var selectedBillingState = billingState.attr('data-selected');
        if (addressDataNativeLocale[selectedBillingState]) {
            addressData = addressDataNativeLocale;
        } else {
            addressData = addressDataEN;
        }
        billingState.trigger('change');
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
                billingState = $('.billingState');
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
            $('.billingState').trigger('change');
        }
        var selectedBillingCity = $('body')
            .find('.billingAddressCity')
            .attr('data-selected');
        if (selectedBillingCity !== 'null') {
            var cityExists = false;
            $('.billingAddressCity option').each(function () {
                if ($(this).val() === selectedBillingCity) {
                    cityExists = true;
                    $('.billingAddressCity option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.billingAddressCity').trigger('change');
                    return false;
                }
            });
            if (!cityExists) {
                var suburbDropdown = $('.billingAddressCity');
                suburbDropdown.prepend(
                    $('<option>', {
                        value: selectedBillingCity,
                        text: selectedBillingCity
                    }).attr('selected', 'selected')
                );
                $('.billingAddressCity').removeClass('is-invalid');
            }
        }
        var selectedBillingSubDistrict = $('body')
            .find('.billingAddressSubdistrict')
            .attr('data-selected');
        if (selectedBillingSubDistrict !== 'null') {
            var subDistrictExists = false;
            $('.billingAddressSubdistrict option').each(function () {
                // eslint-disable-line
                if ($(this).val() === selectedBillingSubDistrict) {
                    $('.billingAddressSubdistrict option').removeAttr(
                        'selected'
                    );
                    $(this).attr('selected', 'selected');
                    $('body')
                        .find('.billingAddressSubdistrict')
                        .trigger('change');
                    subDistrictExists = true;
                    return false;
                }
            });
            if (!subDistrictExists) {
                var subDistrictDropdown = $('.billingAddressSubdistrict');
                subDistrictDropdown.prepend(
                    $('<option>', {
                        value: selectedBillingSubDistrict,
                        text: selectedBillingSubDistrict
                    }).attr('selected', 'selected')
                );
                $('.billingAddressSubdistrict').removeClass('is-invalid');
            }
        }

        var selectedBillingPostalCode = $('body')
            .find('.billingZipCode')
            .attr('data-selected');
        if (selectedBillingPostalCode !== 'null') {
            var postalCodeExists = false;
            $('.billingZipCode option').each(function () {
                // eslint-disable-line
                if ($(this).val() === selectedBillingPostalCode) {
                    $('.billingZipCode option').removeAttr('selected');
                    $(this).attr('selected', 'selected');
                    $('body').find('.billingZipCode').trigger('change');
                    postalCodeExists = true;
                    return false;
                }
            });
            if (!postalCodeExists) {
                // setting city as per place API response
                var zipCodeDropdown = $('.billingZipCode');
                zipCodeDropdown.prepend(
                    $('<option>', {
                        value: selectedBillingPostalCode,
                        text: selectedBillingPostalCode
                    }).attr('selected', 'selected')
                );
                $('.billingZipCode').removeClass('is-invalid');
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
    var selectedState = $(this).val() || $(this).attr('data-selected');
    var suburbDropdown = $('.shippingAddressCity');
    var selectedSuburb = suburbDropdown.attr('data-selected');
    var stateDropdown = $(this);
    var cityMappingObj;
    suburbDropdown.empty(); // clear existing options    
    if (addressDataEN[selectedState]) {
        $(this).empty();
        stateDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select State----'
            }).attr('selected', 'selected')
        );
        $.each(addressDataEN, function (state) {
            if (selectedState === state) {
                $('.shippingState option').removeAttr('selected');
                stateDropdown.append(
                    $('<option>', {
                        value: state,
                        text: state
                    }).attr('selected', 'selected')
                );
            } else {
                stateDropdown.append(
                    $('<option>', {
                        value: state,
                        text: state
                    })
                );
            }
        });
        suburbDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City ----'
            }).attr('selected', 'selected')
        );
        cityMappingObj = addressDataEN[selectedState];
        $.each(cityMappingObj, function (suburb) {
            if (suburb === selectedSuburb) {
                $('.shippingAddressCity option').removeAttr('selected');
                suburbDropdown.append(
                    $('<option>', {
                        value: suburb,
                        text: suburb
                    }).attr('selected', 'selected')
                );
            } else {
                suburbDropdown.append(
                    $('<option>', {
                        value: suburb,
                        text: suburb
                    })
                );
            }
        });
    } else if (addressDataNativeLocale[selectedState]) {
        $(this).empty();
        stateDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select State----'
            }).attr('selected', 'selected')
        );
        $.each(addressDataNativeLocale, function (state) {
            if (selectedState === state) {
                $('.shippingState option').removeAttr('selected');
                stateDropdown.append(
                    $('<option>', {
                        value: state,
                        text: state
                    }).attr('selected', 'selected')
                );
            } else {
                stateDropdown.append(
                    $('<option>', {
                        value: state,
                        text: state
                    })
                );
            }
        });
        suburbDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City ----'
            }).attr('selected', 'selected')
        );
        cityMappingObj = addressDataNativeLocale[selectedState];
        $.each(cityMappingObj, function (suburb) {
            if (suburb === selectedSuburb) {
                $('.shippingAddressCity option').removeAttr('selected');
                suburbDropdown.append(
                    $('<option>', {
                        value: suburb,
                        text: suburb
                    }).attr('selected', 'selected')
                );
            } else {
                suburbDropdown.append(
                    $('<option>', {
                        value: suburb,
                        text: suburb
                    })
                );
            }
        });
    } else {
        suburbDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select State First----'
            }).attr('selected', 'selected')
        );
    }
    suburbDropdown.trigger('change');
    var shippingExtimate = $('.estimeted-shipping-text').attr("data-estimated-shipping-text");
    var shippingText = $('.estimeted-shipping-text').attr("data-shipping-text");
    var updateShippingMethodsURL =
        $('input[name="update-shipping-method-url"]').val() +
        '?stateCode=' +
        selectedState;
    $.ajax({
        type: 'POST',
        url: updateShippingMethodsURL,
        success: function (data) {
            shippingHelpers.methods.updateShippingMethods(data.order.shipping);
            $('.grand-total-wrap .grand-total')
                .empty()
                .text(data.order.priceTotal);
            if (data.isOrderShippable) {
                $('.cart-dangerous-goods').addClass('d-none');
            } else {
                $('.cart-dangerous-goods').removeClass('d-none');
            }
            if(data.isEstimatedShipping || data.order.hasFreeShipping){
                $('.tax-calculated-state').text(shippingText);
            }else{
                $('.tax-calculated-state').text(shippingExtimate);
            }
        }
    });
});

$('.shippingAddressCity').change(function () {
    var selectedState = $('.shippingState').val();
    var selectedSuburb = $(this).val();
    var subDistrictDropdown = $('.shippingAddressSubdistrict');
    var zipCodeDropdown = $('.shippingZipCode');
    var selectedSubDistrict = subDistrictDropdown.attr('data-selected');
    var selectedZipCode = zipCodeDropdown.attr('data-selected');
    var districtMappingObj;
    subDistrictDropdown.empty(); // clear existing options
    zipCodeDropdown.empty(); // clear existing options

    if (
        addressDataEN[selectedState] &&
        addressDataEN[selectedState][selectedSuburb]
    ) {
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Sub-District ----'
            }).attr('selected', 'selected')
        );
        zipCodeDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Zip-Code ----'
            }).attr('selected', 'selected')
        );
        districtMappingObj = addressDataEN[selectedState][selectedSuburb];
        $.each(districtMappingObj.subDistrict, function (index, district) {
            if (district === selectedSubDistrict) {
                subDistrictDropdown.append(
                    $('<option>', {
                        value: district,
                        text: district
                    }).attr('selected', 'selected')
                );
            } else {
                subDistrictDropdown.append(
                    $('<option>', {
                        value: district,
                        text: district
                    })
                );
            }
        });
        $.each(districtMappingObj.postalCodes, function (index, zipcode) {
            if (zipcode === selectedZipCode) {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipcode,
                        text: zipcode
                    }).attr('selected', 'selected')
                );
            } else {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipcode,
                        text: zipcode
                    })
                );
            }
        });
    } else if (
        addressDataNativeLocale[selectedState] &&
        addressDataNativeLocale[selectedState][selectedSuburb]
    ) {
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Sub-District ----'
            }).attr('selected', 'selected')
        );
        zipCodeDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Zip-Code ----'
            }).attr('selected', 'selected')
        );
        districtMappingObj =
            addressDataNativeLocale[selectedState][selectedSuburb];
        $.each(districtMappingObj.subDistrict, function (index, district) {
            if (district === selectedSubDistrict) {
                subDistrictDropdown.append(
                    $('<option>', {
                        value: district,
                        text: district
                    }).attr('selected', 'selected')
                );
            } else {
                subDistrictDropdown.append(
                    $('<option>', {
                        value: district,
                        text: district
                    })
                );
            }
        });
        $.each(districtMappingObj.postalCodes, function (index, zipcode) {
            if (zipcode === selectedZipCode) {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipcode,
                        text: zipcode
                    }).attr('selected', 'selected')
                );
            } else {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipcode,
                        text: zipcode
                    })
                );
            }
        });
    } else {
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City First----'
            }).attr('selected', 'selected')
        );
        zipCodeDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City First----'
            }).attr('selected', 'selected')
        );
    }
    subDistrictDropdown.trigger('change');
    zipCodeDropdown.trigger('change');
});

$('.shippingAddressSubdistrict').change(function () {
    var selectedState = $('.shippingState').val();
    var selectedSuburb = $('.shippingAddressCity').val();
    var selectedSubDistrict = $(this).val();
    var subDistrictDropdown = $('.shippingAddressSubdistrict');
    var subDistrictMappingObj;
    subDistrictDropdown.empty(); // clear existing options

    if (
        addressDataEN[selectedState] &&
        addressDataEN[selectedState][selectedSuburb]
    ) {
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Sub-District ----'
            }).attr('selected', 'selected')
        );
        subDistrictMappingObj = addressDataEN[selectedState][selectedSuburb];
        $.each(
            subDistrictMappingObj.subDistrict,
            function (index, subDistrict) {
                if (subDistrict === selectedSubDistrict) {
                    subDistrictDropdown.append(
                        $('<option>', {
                            value: subDistrict,
                            text: subDistrict
                        }).attr('selected', 'selected')
                    );
                } else {
                    subDistrictDropdown.append(
                        $('<option>', {
                            value: subDistrict,
                            text: subDistrict
                        })
                    );
                }
            }
        );
    } else if (
        addressDataNativeLocale[selectedState] &&
        addressDataNativeLocale[selectedState][selectedSuburb]
    ) {
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Sub-District ----'
            }).attr('selected', 'selected')
        );
        subDistrictMappingObj =
            addressDataNativeLocale[selectedState][selectedSuburb];
        $.each(
            subDistrictMappingObj.subDistrict,
            function (index, subDistrict) {
                if (subDistrict === selectedSubDistrict) {
                    subDistrictDropdown.append(
                        $('<option>', {
                            value: subDistrict,
                            text: subDistrict
                        }).attr('selected', 'selected')
                    );
                } else {
                    subDistrictDropdown.append(
                        $('<option>', {
                            value: subDistrict,
                            text: subDistrict
                        })
                    );
                }
            }
        );
    } else {
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City First----'
            }).attr('selected', 'selected')
        );
    }
});

$('.shippingZipCode').change(function () {
    var selectedState = $('.shippingState').val();
    var selectedSuburb = $('.shippingAddressCity').val();
    var selectedZipCode = $(this).val();
    var zipCodeDropdown = $('.shippingZipCode');
    var zipCodeMappingObj;
    zipCodeDropdown.empty(); // clear existing options

    if (
        addressDataEN[selectedState] &&
        addressDataEN[selectedState][selectedSuburb]
    ) {
        zipCodeDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Zip-Code ----'
            }).attr('selected', 'selected')
        );
        zipCodeMappingObj = addressDataEN[selectedState][selectedSuburb];
        $.each(zipCodeMappingObj.postalCodes, function (index, zipCode) {
            if (zipCode === selectedZipCode) {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipCode,
                        text: zipCode
                    }).attr('selected', 'selected')
                );
            } else {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipCode,
                        text: zipCode
                    })
                );
            }
        });
    } else if (
        addressDataNativeLocale[selectedState] &&
        addressDataNativeLocale[selectedState][selectedSuburb]
    ) {
        zipCodeDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Zip-Code ----'
            }).attr('selected', 'selected')
        );
        zipCodeMappingObj =
            addressDataNativeLocale[selectedState][selectedSuburb];
        $.each(zipCodeMappingObj.postalCodes, function (index, zipCode) {
            if (zipCode === selectedZipCode) {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipCode,
                        text: zipCode
                    }).attr('selected', 'selected')
                );
            } else {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipCode,
                        text: zipCode
                    })
                );
            }
        });
    } else {
        zipCodeDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City First----'
            }).attr('selected', 'selected')
        );
    }
});

$('.billingState').change(function () {
    var selectedState = $(this).val() || $(this).attr('data-selected');
    var suburbDropdown = $('.billingAddressCity');
    var selectedSuburb = suburbDropdown.attr('data-selected');
    var stateDropdown = $('.billingState');
    var cityMappingObj;
    suburbDropdown.empty(); // clear existing options
    if (addressDataEN[selectedState]) {
        $(this).empty();
        stateDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select State----'
            }).attr('selected', 'selected')
        );
        $.each(addressDataEN, function (state) {
            if (selectedState === state) {
                $('.billingState option').removeAttr('selected');
                stateDropdown.append(
                    $('<option>', {
                        value: state,
                        text: state
                    }).attr('selected', 'selected')
                );
            } else {
                stateDropdown.append(
                    $('<option>', {
                        value: state,
                        text: state
                    })
                );
            }
        });
        suburbDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City ----'
            }).attr('selected', 'selected')
        );
        cityMappingObj = addressDataEN[selectedState];
        $.each(cityMappingObj, function (suburb) {
            if (suburb === selectedSuburb) {
                $('.billingAddressCity option').removeAttr('selected');
                suburbDropdown.append(
                    $('<option>', {
                        value: suburb,
                        text: suburb
                    }).attr('selected', 'selected')
                );
            } else {
                suburbDropdown.append(
                    $('<option>', {
                        value: suburb,
                        text: suburb
                    })
                );
            }
        });
    } else if (addressDataNativeLocale[selectedState]) {
        $(this).empty();
        stateDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select State----'
            }).attr('selected', 'selected')
        );
        $.each(addressDataNativeLocale, function (state) {
            if (selectedState === state) {
                $('.billingState option').removeAttr('selected');
                stateDropdown.append(
                    $('<option>', {
                        value: state,
                        text: state
                    }).attr('selected', 'selected')
                );
            } else {
                stateDropdown.append(
                    $('<option>', {
                        value: state,
                        text: state
                    })
                );
            }
        });
        suburbDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City ----'
            }).attr('selected', 'selected')
        );
        cityMappingObj = addressDataNativeLocale[selectedState];
        $.each(cityMappingObj, function (suburb) {
            if (suburb === selectedSuburb) {
                $('.billingAddressCity option').removeAttr('selected');
                suburbDropdown.append(
                    $('<option>', {
                        value: suburb,
                        text: suburb
                    }).attr('selected', 'selected')
                );
            } else {
                suburbDropdown.append(
                    $('<option>', {
                        value: suburb,
                        text: suburb
                    })
                );
            }
        });
    } else {
        suburbDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select State First----'
            }).attr('selected', 'selected')
        );
    }
    suburbDropdown.trigger('change');
});

$('.billingAddressCity').change(function () {
    var selectedState = $('.billingState').val();
    var selectedSuburb = $(this).val();
    var subDistrictDropdown = $('.billingAddressSubdistrict');
    var zipCodeDropdown = $('.billingZipCode');
    var selectedSubDistrict = subDistrictDropdown.attr('data-selected');
    var selectedZipCode = zipCodeDropdown.attr('data-selected');
    var districtMappingObj;
    subDistrictDropdown.empty(); // clear existing options
    zipCodeDropdown.empty(); // clear existing options

    if (
        addressDataEN[selectedState] &&
        addressDataEN[selectedState][selectedSuburb]
    ) {
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Sub-District ----'
            }).attr('selected', 'selected')
        );
        zipCodeDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Zip-Code ----'
            }).attr('selected', 'selected')
        );
        districtMappingObj = addressDataEN[selectedState][selectedSuburb];
        $.each(districtMappingObj.subDistrict, function (index, district) {
            if (district === selectedSubDistrict) {
                subDistrictDropdown.append(
                    $('<option>', {
                        value: district,
                        text: district
                    }).attr('selected', 'selected')
                );
            } else {
                subDistrictDropdown.append(
                    $('<option>', {
                        value: district,
                        text: district
                    })
                );
            }
        });
        $.each(districtMappingObj.postalCodes, function (index, zipcode) {
            if (zipcode === selectedZipCode) {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipcode,
                        text: zipcode
                    }).attr('selected', 'selected')
                );
            } else {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipcode,
                        text: zipcode
                    })
                );
            }
        });
    } else if (
        addressDataNativeLocale[selectedState] &&
        addressDataNativeLocale[selectedState][selectedSuburb]
    ) {
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Sub-District ----'
            }).attr('selected', 'selected')
        );
        zipCodeDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Zip-Code ----'
            }).attr('selected', 'selected')
        );
        districtMappingObj =
            addressDataNativeLocale[selectedState][selectedSuburb];
        $.each(districtMappingObj.subDistrict, function (index, district) {
            if (district === selectedSubDistrict) {
                subDistrictDropdown.append(
                    $('<option>', {
                        value: district,
                        text: district
                    }).attr('selected', 'selected')
                );
            } else {
                subDistrictDropdown.append(
                    $('<option>', {
                        value: district,
                        text: district
                    })
                );
            }
        });
        $.each(districtMappingObj.postalCodes, function (index, zipcode) {
            if (zipcode === selectedZipCode) {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipcode,
                        text: zipcode
                    }).attr('selected', 'selected')
                );
            } else {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipcode,
                        text: zipcode
                    })
                );
            }
        });
    } else {
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City First----'
            }).attr('selected', 'selected')
        );
        zipCodeDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City First----'
            }).attr('selected', 'selected')
        );
    }
    subDistrictDropdown.trigger('change');
    zipCodeDropdown.trigger('change');
});

$('.billingAddressSubdistrict').change(function () {
    var selectedState = $('.billingState').val();
    var selectedSuburb = $('.billingAddressCity').val();
    var selectedSubDistrict = $(this).val();
    var subDistrictDropdown = $('.billingAddressSubdistrict');
    var subDistrictMappingObj;
    subDistrictDropdown.empty(); // clear existing options

    if (
        addressDataEN[selectedState] &&
        addressDataEN[selectedState][selectedSuburb]
    ) {
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Sub-District ----'
            }).attr('selected', 'selected')
        );
        subDistrictMappingObj = addressDataEN[selectedState][selectedSuburb];
        $.each(
            subDistrictMappingObj.subDistrict,
            function (index, subDistrict) {
                if (subDistrict === selectedSubDistrict) {
                    subDistrictDropdown.append(
                        $('<option>', {
                            value: subDistrict,
                            text: subDistrict
                        }).attr('selected', 'selected')
                    );
                } else {
                    subDistrictDropdown.append(
                        $('<option>', {
                            value: subDistrict,
                            text: subDistrict
                        })
                    );
                }
            }
        );
    } else if (
        addressDataNativeLocale[selectedState] &&
        addressDataNativeLocale[selectedState][selectedSuburb]
    ) {
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Sub-District ----'
            }).attr('selected', 'selected')
        );
        subDistrictMappingObj =
            addressDataNativeLocale[selectedState][selectedSuburb];
        $.each(
            subDistrictMappingObj.subDistrict,
            function (index, subDistrict) {
                if (subDistrict === selectedSubDistrict) {
                    subDistrictDropdown.append(
                        $('<option>', {
                            value: subDistrict,
                            text: subDistrict
                        }).attr('selected', 'selected')
                    );
                } else {
                    subDistrictDropdown.append(
                        $('<option>', {
                            value: subDistrict,
                            text: subDistrict
                        })
                    );
                }
            }
        );
    } else {
        subDistrictDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City First----'
            }).attr('selected', 'selected')
        );
    }
});

$('.billingZipCode').change(function () {
    var selectedState = $('.billingState').val();
    var selectedSuburb = $('.billingAddressCity').val();
    var selectedZipCode = $(this).val();
    var zipCodeDropdown = $('.billingZipCode');
    var zipCodeMappingObj;
    zipCodeDropdown.empty(); // clear existing options

    if (
        addressDataEN[selectedState] &&
        addressDataEN[selectedState][selectedSuburb]
    ) {
        zipCodeDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Zip-Code ----'
            }).attr('selected', 'selected')
        );
        zipCodeMappingObj = addressDataEN[selectedState][selectedSuburb];
        $.each(zipCodeMappingObj.postalCodes, function (index, zipCode) {
            if (zipCode === selectedZipCode) {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipCode,
                        text: zipCode
                    }).attr('selected', 'selected')
                );
            } else {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipCode,
                        text: zipCode
                    })
                );
            }
        });
    } else if (
        addressDataNativeLocale[selectedState] &&
        addressDataNativeLocale[selectedState][selectedSuburb]
    ) {
        zipCodeDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select Zip-Code ----'
            }).attr('selected', 'selected')
        );
        zipCodeMappingObj =
            addressDataNativeLocale[selectedState][selectedSuburb];
        $.each(zipCodeMappingObj.postalCodes, function (index, zipCode) {
            if (zipCode === selectedZipCode) {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipCode,
                        text: zipCode
                    }).attr('selected', 'selected')
                );
            } else {
                zipCodeDropdown.append(
                    $('<option>', {
                        value: zipCode,
                        text: zipCode
                    })
                );
            }
        });
    } else {
        zipCodeDropdown.prepend(
            $('<option>', {
                value: '',
                text: '---- Select City First----'
            }).attr('selected', 'selected')
        );
    }
});

$('.skipToPayment').on('click', function (e) {
    e.preventDefault();
    $('.submit-shipping').click();
});
