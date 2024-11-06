'use strict';

var base = require('base/addressBook/addressBook');
var formValidation = require('../components/formValidation');
var addressDataNativeLocale = require('../addressData');
var addressDataEN = require('../addressDataEN');
var intlTelInput = require('intl-tel-input');
var utils = require('utils.js');
var action;
var isDefault;
var deleteUrl;

var location = window.location;

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
 * Create an alert to display the error message
 * @param {object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error '
        + 'fade show" role="alert">'
        + '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'
        + '<span aria-hidden="true">&times;</span>'
        + '</button>' + message + '</div>';

    $('.error-messaging').append(errorHtml);
}

/**
 * This will update the url when success message is showned.
 */
$(document).on('readystatechange', function () {
    if (document.readyState === 'complete') {
        var url = new URL(window.location.href);
        if (url.searchParams.has('showstatusmsg')) {
            setTimeout(function () {
                url.searchParams.delete('showstatusmsg');
                window.history.replaceState(null, '', url.toString());
            }, 5000);
        }
    }
});

/**
 * This will check googlerecaptcha token and submit address form
 * @param {string} token - token
 */
window.submitAddressForm = function (token) {
    return new Promise(function (resolve, reject) {
        if (!token) {
            reject();
        }
        if (token !== '') {
            $('.g-recaptcha').closest('form.address-form').submit();
            resolve();
        }
        grecaptcha.reset();
    });
};

/**
 * updated the function for address-form submit
 */
base.submitAddress = function () {
    $(document).on('submit', 'form.address-form', function (e) {
        var $form = $(this);
        e.preventDefault();
        if ($form.find('input,select').serialize() !== window.addressForm) {
            action = $form.attr('action');
            $form.spinner().start();
            $('form.address-form').trigger('address:submit', e);
            $.ajax({
                url: action,
                type: 'post',
                dataType: 'json',
                data: $form.serialize(),
                success: function (data) {
                    $form.spinner().stop();
                    window.addressForm = '';
                    if (!data.success) {
                        formValidation($form, data);
                    } else {
                        location.href = data.redirectUrl;
                    }
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    }
                    $form.spinner().stop();
                }
            });
            return false;
        } 
        $('#address-form').modal('hide');
        return false;
    });
};

base.removeAddress = function () {
    $('body').on('click', '.remove-address', function (e) {
        e.preventDefault();
        isDefault = $(this).data('default');
        if (isDefault) {
            deleteUrl = $(this).data('url')
                + '?addressId='
                + $(this).data('id')
                + '&isDefault='
                + isDefault;
        } else {
            deleteUrl = $(this).data('url') + '?addressId=' + $(this).data('id');
        }
        $('.product-to-remove').empty().text($(this).data('id'));
    });
};

/**
 * updated the function for address-form submit
 */
base.removeAddressConfirmation = function () {
    $('body').on('click', '.delete-confirmation-btn', function (e) {
        e.preventDefault();
        $.ajax({
            url: deleteUrl,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $('#uuid-' + data.UUID).remove();
                if (isDefault) {
                    var addressId = $('.card .address-heading').first().text();
                    var addressHeading =
                        addressId + ' (' + data.defaultMsg + ')';
                    $('.card .address-heading').first().text(addressHeading);
                    $('.card .card-make-default-link').first().remove();
                    $('.remove-address').data('default', true);
                    if (data.message) {
                        var toInsert =
                            '<div><h3>' + data.message + '</h3><div>';
                        $('.addressList').after(toInsert);
                    }
                }
                window.location.href = data.redirectUrl;
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                }
                $.spinner().stop();
            }
        });
    });
};


/**
 * Get the address details to edit the address.
 */
$(document).on('click', '#editAddress', function () {
    action = $(this).data('href');
    var addressID = $(this).data('id');
    var data = {
        addressId: addressID
    };
    $.ajax({
        url: action,
        method: 'GET',
        data: data,
        success: function (response) {
            $('#modalContent').html(response);
            var input = $('#modalContent').find(
                '#accountAddressAutoComplete'
            )[0];
            var options = {
                placeholder: ' ',
                componentRestrictions: { country: 'VN' },
                fields: [
                    'formatted_address',
                    'geometry',
                    'name',
                    'address_components'
                ],
                strictBounds: false,
                types: ['address']
            };
            var autocomplete = new google.maps.places.Autocomplete(
                input,
                options
            );
            autocomplete.addListener('place_changed', function () {
                var place = autocomplete.getPlace();
                var components = place.address_components;
                var addressObject = {};
                for (var index = 0; index < components.length; index++) {
                    var element = components[index];
                    switch (element.types[0]) {
                        case 'street_number':
                            addressObject.address1 = element.long_name + ' ';
                            break;
                        case 'route':
                            if (addressObject.address1) {
                                addressObject.address1 += element.long_name;
                            } else {
                                addressObject.address1 = element.long_name;
                            }
                            break;
                        case 'sublocality_level_1':
                            if ('address1' in addressObject) {
                                addressObject.address2 = element.long_name;
                            } else {
                                addressObject.address1 += element.long_name;
                            }
                            break;
                        case 'locality':
                            addressObject.city = element.long_name;
                            break;
                        case 'administrative_area_level_1':
                            addressObject.state = element.long_name;
                            break;
                        case 'administrative_area_level_2':
                            addressObject.shippingAddressSubdistrict =
                                element.long_name;
                            break;
                        default:
                            break;
                    }
                    var fullAddress = addressObject.address1;
                    if (addressObject.address2) {
                        fullAddress += ' ' + addressObject.address2;
                    }
                    if (fullAddress.length > 30) {
                        addressObject.address1 = fullAddress
                            .substring(0, 30)
                            .trim();
                        addressObject.address2 = fullAddress
                            .substring(31, 60)
                            .trim();
                    }
                }
                var form = $('#modalContent').find('.address-form');
                form.find('#address1')
                    .val(addressObject.address1)
                    .trigger('change');
                form.find('#address2')
                    .val(addressObject.address2)
                    .trigger('change');
                form.find('#state').val(addressObject.state).trigger('change');
                form.find('#city').val(addressObject.city).trigger('change');
                if (
                    addressObject.address1 &&
                        addressObject.state &&
                        addressObject.addressDistrict &&
                        addressObject.addressSubdistrict
                ) {
                    if (
                        form.find('#city').val() === '' ||
                            form.find('#city').val() === null
                    ) {
                        // setting city as per place API response
                        var suburbDropdown = $('.address-city-input');
                        suburbDropdown.empty();
                        suburbDropdown.prepend(
                            $('<option>', {
                                value: addressObject.city,
                                text: addressObject.city
                            }).attr('selected', 'selected')
                        );
                        $('.address-city-input').removeClass('is-invalid');

                        // setting district as per place API response
                        var billingAddressDistrictDropdown = $(
                            '.address-district-input'
                        );
                        billingAddressDistrictDropdown.empty();
                        billingAddressDistrictDropdown.prepend(
                            $('<option>', {
                                value: addressObject.addressDistrict,
                                text: addressObject.addressDistrict
                            }).attr('selected', 'selected')
                        );
                        $('.address-district-input').removeClass(
                            'is-invalid'
                        );

                        // setting subdistrict as per place API response
                        var billingAddressSubDistrictDropdown = $(
                            '.address-subdistrict-input'
                        );
                        billingAddressSubDistrictDropdown.empty();
                        billingAddressSubDistrictDropdown.prepend(
                            $('<option>', {
                                value: addressObject.addressSubdistrict,
                                text: addressObject.addressSubdistrict
                            }).attr('selected', 'selected')
                        );
                        $('.address-subdistrict-input').removeClass(
                            'is-invalid'
                        );
                    }
                }
            });
            /** Append Pac container inside div */
            var addressInputElement = $('#modalContent').find(
                '#accountAddressAutoComplete'
            );
            addressInputElement.on('focus', function () {
                var pacContainer = $('.pac-container');
                $(addressInputElement.parent()).append(pacContainer);
            });
            var phone = $('#modalContent').find('.editAddressPhone')[0];
            var editIntl = intlTelInput(phone, {
                utilsScript: utils,
                showFlags: true,
                strictMode: true,
                showSelectedDialCode: true,
                initialCountry: $('.addressDialCodeCountry').val(),
                formatOnDisplay: false,
                formatAsYouType: false
            });
            $('.editAddressPhone').on('countrychange', function () {
                var countryData = editIntl.getSelectedCountryData();
                $('.addressDialCode').val(countryData.dialCode);
                $('.addressDialCodeCountry').val(countryData.iso2);
            });
            $('#address-form').modal('show');
            $('body').trigger('form:invalid');
            $('#modalContent').find('.address-state-input').trigger('change');
            var selectedAddressCity = $('#modalContent')
                .find('.address-city-input')
                .attr('data-selected');
            if (selectedAddressCity !== 'null') {
                $('.address-city-input option').each(function () {
                    if ($(this).val() === selectedAddressCity) {
                        $('.address-city-input option').removeAttr('selected');
                        $(this).attr('selected', 'selected');
                        $('body').find('.address-city-input').trigger('change');
                        return false;
                    }
                });
            }
            var addressForm = $($(response)[0]).find('input,select');
            window.addressForm = $(addressForm).serialize();
        }
    });
});

/** Append Pac container inside div */
var addressInputElement = $('#accountAddressAutoComplete');
addressInputElement.on('focus', function () {
    var pacContainer = $('.pac-container');
    $(addressInputElement.parent()).append(pacContainer);
});

module.exports = $.extend({}, base, {
    stateDropdown: function () {
        $('body').on('change', '.address-state-input', function () {
            var selectedState = $(this).val();
            var suburbDropdown = $(this)
                .closest('form')
                .find('.address-city-input');
            suburbDropdown.empty(); // clear existing options
            var stateDropdown = $(this);
            var selectedSuburb = suburbDropdown.attr('data-selected');
            if (addressDataEN[selectedState]) {
                stateDropdown.empty();
                stateDropdown.prepend(
                    $('<option>', {
                        value: '',
                        text: '---- Select State ----'
                    }).attr('selected', 'selected')
                );
                $.each(addressDataEN, function (state) {
                    if (state === selectedState) {
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
                $.each(addressDataEN[selectedState], function (suburb) {
                    if (suburb === selectedSuburb) {
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
                stateDropdown.empty();
                stateDropdown.prepend(
                    $('<option>', {
                        value: '',
                        text: '---- Select State ----'
                    }).attr('selected', 'selected')
                );
                $.each(addressDataNativeLocale, function (state) {
                    if (state === selectedState) {
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
                $.each(
                    addressDataNativeLocale[selectedState],
                    function (suburb) {
                        if (suburb === selectedSuburb) {
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
                    }
                );
            } else {
                suburbDropdown.prepend(
                    $('<option>', {
                        value: '',
                        text: '---- Select State First----'
                    }).attr('selected', 'selected')
                );
            }
            if (
                suburbDropdown.data('selected') !== '' ||
                suburbDropdown.data('selected') !== null
            ) {
                var selectedVal = suburbDropdown.data('selected');
                suburbDropdown.val(selectedVal);
            }
            suburbDropdown.trigger('change');
        });
    },
    cityDropdown: function () {
        $('body').on('change', '.address-city-input', function () {
            var selectedState = $(this)
                .closest('form')
                .find('.address-state-input')
                .val();
            var selectedSuburb = $(this).val();
            var districtDropdown = $(this)
                .closest('form')
                .find('.address-district-input');
            var selectedDistrict = districtDropdown.data('selected');
            districtDropdown.empty(); // clear existing options
            var districtMappingObj;

            if (
                addressDataEN[selectedState] &&
                addressDataEN[selectedState][selectedSuburb]
            ) {
                districtMappingObj = addressDataEN[selectedState][selectedSuburb];
                $.each(districtMappingObj, function (district) {
                    if (selectedDistrict === district) {
                        districtDropdown.append(
                            $('<option>', {
                                value: district,
                                text: district
                            }).attr('selected', 'selected')
                        );
                    } else {
                        districtDropdown.append(
                            $('<option>', {
                                value: district,
                                text: district
                            })
                        );
                    }
                }); 
            } else if (
                addressDataNativeLocale[selectedState] &&
                addressDataNativeLocale[selectedState][selectedSuburb]
            ) {
                $.each(districtMappingObj, function (district) {
                    if (selectedDistrict === district) {
                        districtDropdown.append(
                            $('<option>', {
                                value: district,
                                text: district
                            }).attr('selected', 'selected')
                        );
                    } else {
                        districtDropdown.append(
                            $('<option>', {
                                value: district,
                                text: district
                            })
                        );
                    }
                });
            }
            districtDropdown.trigger('change');
        });
    },
    districtDropdown: function () {
        $('body').on('change', '.address-district-input', function () {
            var selectedState = $(this)
                .closest('form')
                .find('.address-state-input')
                .val();
            var selectedSuburb = $(this)
                .closest('form')
                .find('.address-city-input').val();
            var selectedDistrict = $(this).val();
            var subDistrictDropdown = $(this)
                .closest('form')
                .find('.address-subdistrict-input');
            var selectedSubDistrict = subDistrictDropdown.data('selected');
            subDistrictDropdown.empty(); // clear existing options
            var subDistrictMappingObj;

            if (
                addressDataEN[selectedState] &&
                addressDataEN[selectedState][selectedSuburb] &&
                addressDataEN[selectedState][selectedSuburb][selectedDistrict]
            ) {
                subDistrictMappingObj =
                    addressDataEN[selectedState][selectedSuburb];
                $.each(subDistrictMappingObj, function (subDistrict) {
                    if (selectedSubDistrict === subDistrict) {
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
                }); 
            } else if (
                addressDataNativeLocale[selectedState] &&
                addressDataNativeLocale[selectedState][selectedSuburb] &&
                addressDataEN[selectedState][selectedSuburb][selectedDistrict]
            ) {
                subDistrictMappingObj =
                    addressDataNativeLocale[selectedState][selectedSuburb];
                $.each(subDistrictMappingObj, function (subDistrict) {
                    if (selectedSubDistrict === subDistrict) {
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
                }); 
            }
        });
    },
    intlPhoneInit: function () {
        var phone = document.querySelector('.addressPhoneNumber');
        var iti = intlTelInput(phone, {
            utilsScript: utils,
            showFlags: true,
            strictMode: true,
            showSelectedDialCode: true,
            initialCountry: $('.dialCodeCountry').val(),
            formatOnDisplay: false,
            formatAsYouType: false
        });
        var initCountryData = iti.getSelectedCountryData();
        $('.dialCode').val(initCountryData.dialCode);
        $('.dialCodeCountry').val(initCountryData.iso2);
        $('.addressPhoneNumber').on('countrychange', function () {
            var countryData = iti.getSelectedCountryData();
            $('.dialCode').val(countryData.dialCode);
            $('.dialCodeCountry').val(countryData.iso2);
        });
    },
    validation: function () {
        $('.form-control').on('input change', function () {
            validateFields($(this));
        });
    }
});
