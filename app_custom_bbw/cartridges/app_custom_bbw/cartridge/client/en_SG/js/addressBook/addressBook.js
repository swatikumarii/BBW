'use strict';

var base = require('base/addressBook/addressBook');
var formValidation = require('../components/formValidation');
var addressData = require('../addressData.js');
var intlTelInput = require('intl-tel-input');
var utils = require('utils.js');
var action;
var isDefault;
var deleteUrl;

var location = window.location;

/**
 * Create an alert to display the error message
 * @param {object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml =
        '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' +
        message +
        '</div>';

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
    $('body').on('submit', 'form.address-form', function (e) {
        var $form = $(this);
        e.preventDefault();
        if ($form.find('input').serialize() !== window.addressForm) {
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
            deleteUrl =
                $(this).data('url') +
                '?addressId=' +
                $(this).data('id') +
                '&isDefault=' +
                isDefault;
        } else {
            deleteUrl =
                $(this).data('url') + '?addressId=' + $(this).data('id');
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
                componentRestrictions: { country: 'SG' },
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
                        case 'neighborhood':
                            addressObject.city = element.long_name;
                            break;
                        case 'locality':
                            addressObject.state = element.long_name;
                            break;
                        case 'postal_code':
                            addressObject.zipcode = element.long_name;
                            break;
                        default:
                            break;
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
                form.find('#zipCode')
                    .val(addressObject.zipcode)
                    .trigger('change');
            });
            /** Append Pac container inside div */
            var addressInputElement = $('#modalContent').find(
                '#accountAddressAutoComplete'
            );
            addressInputElement.on('focus', function () {
                var pacContainer = $('.pac-container');
                $(addressInputElement.parent()).append(pacContainer);
            });
            var phone = $('#modalContent').find('.addressPhoneNumber')[0];
            intlTelInput(phone, {
                utilsScript: utils,
                showFlags: true,
                strictMode: true,
                showSelectedDialCode: true,
                initialCountry: 'sg',
                countryOrder: ['sg']
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
            var selectedPostalCode = $('#modalContent')
                .find('.address-zipcode-input')
                .attr('data-selected');
            if (selectedPostalCode !== 'null') {
                $('.address-zipcode-input option').each(function () {
                    if ($(this).val() === selectedPostalCode) {
                        $('.address-zipcode-input option').removeAttr(
                            'selected'
                        );
                        $(this).attr('selected', 'selected');
                        $('body')
                            .find('.address-zipcode-input')
                            .trigger('change');
                        return false;
                    }
                });
            }
            var addressForm = $($(response)[0]).find('input');
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
    intlPhoneInit: function () {
        var phone = document.querySelector('.addressPhoneNumber');
        intlTelInput(phone, {
            utilsScript: utils,
            showFlags: true,
            strictMode: true,
            showSelectedDialCode: true,
            initialCountry: 'sg',
            countryOrder: ['sg']
        });
    }
});
