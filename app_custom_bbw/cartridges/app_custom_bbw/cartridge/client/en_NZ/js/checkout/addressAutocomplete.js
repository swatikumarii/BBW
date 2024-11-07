'use strict';

module.exports = {
    initialize: function () {
        var input = document.getElementById('shippingAddressAutoComplete');
        var options = {
            placeholder: ' ',
            componentRestrictions: { country: 'NZ' },
            fields: [
                'formatted_address',
                'geometry',
                'name',
                'address_components'
            ],
            strictBounds: false,
            types: ['address']
        };
        var autocomplete = new google.maps.places.Autocomplete(input, options);
        $(input).removeAttr('disabled');
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
                    case 'administrative_area_level_2':
                        addressObject.city = element.long_name;
                        break;
                    case 'administrative_area_level_1':
                        addressObject.state = element.long_name;
                        break;
                    case 'administrative_area_level_3':
                        addressObject.shippingAddressDistrict = element.long_name;
                        break;
                    case 'postal_code':
                        addressObject.zipcode = element.long_name;
                        break;
                    default:
                        break;
                }
            }
            var form = $('.shipping-form');
            form.find('#shippingAddressOnedefault')
                .val(addressObject.address1)
                .trigger('change');
            form.find('#shippingAddressTwodefault')
                .val(addressObject.address2)
                .trigger('change');
            form.find('#shippingStatedefault')
                .val(addressObject.state)
                .trigger('change');
            form.find('#shippingAddressCitydefault')
                .val(addressObject.city)
                .trigger('change');
            form.find('#shippingZipCodedefault')
                .val(addressObject.zipcode)
                .trigger('change');
            form.find('#shippingAddressDistrictdefault')
                .val(addressObject.shippingAddressDistrict)
                .trigger('change');
            if (
                addressObject.address1 &&
                addressObject.state &&
                addressObject.shippingAddressDistrict &&
                addressObject.zipcode
            ) {
                if (
                    form.find('#shippingAddressCitydefault').val() === '' ||
                    form.find('#shippingAddressCitydefault').val() === null
                ) {
                    // setting city as per place API response
                    var suburbDropdown = $('.shippingAddressCity');
                    suburbDropdown.empty();
                    suburbDropdown.prepend(
                        $('<option>', {
                            value: addressObject.city,
                            text: addressObject.city
                        }).attr('selected', 'selected')
                    );
                    var cityError = $('#defaultCity');
                    cityError.empty();
                    $('.shippingAddressCity').removeClass('is-invalid');

                    // setting district as per place API response
                    var shippingAddressDistrictDropdown = $('.shippingAddressDistrict');
                    shippingAddressDistrictDropdown.empty();
                    shippingAddressDistrictDropdown.prepend(
                        $('<option>', {
                            value: addressObject.shippingAddressDistrict,
                            text: addressObject.shippingAddressDistrict
                        }).attr('selected', 'selected')
                    );
                    var shippingAddressDistrictError = $('#defaultDistrict');
                    shippingAddressDistrictError.empty();
                    $('.shippingAddressDistrict').removeClass(
                        'is-invalid'
                    );

                    // setting zipcode as per place API response
                    var zipcodeDropdown = $('.shippingZipCode');
                    zipcodeDropdown.empty();
                    zipcodeDropdown.prepend(
                        $('<option>', {
                            value: addressObject.zipcode,
                            text: addressObject.zipcode
                        }).attr('selected', 'selected')
                    );
                    var zipcodeError = $('#defaultZipCode');
                    zipcodeError.empty();
                    $('.shippingZipCode').removeClass('is-invalid');
                }
            }
        });
    },
    initializeBilling: function () {
        var input = document.getElementById('billingAddressAutoComplete');
        var options = {
            placeholder: ' ',
            componentRestrictions: { country: 'NZ' },
            fields: [
                'formatted_address',
                'geometry',
                'name',
                'address_components'
            ],
            strictBounds: false,
            types: ['address']
        };
        var autocomplete = new google.maps.places.Autocomplete(input, options);
        $(input).removeAttr('disabled');
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
                    case 'administrative_area_level_2':
                        addressObject.city = element.long_name;
                        break;
                    case 'administrative_area_level_1':
                        addressObject.state = element.long_name;
                        break;
                    case 'administrative_area_level_3':
                        addressObject.addressDistrict = element.long_name;
                        break;
                    case 'postal_code':
                        addressObject.zipcode = element.long_name;
                        break;
                    default:
                        break;
                }
            }
            var form = $('.billing-form');
            form.find('#billingAddressOne')
                .val(addressObject.address1)
                .trigger('change');
            form.find('#billingAddressTwo')
                .val(addressObject.address2)
                .trigger('change');
            form.find('#billingState')
                .val(addressObject.state)
                .trigger('change');
            form.find('#billingAddressCity')
                .val(addressObject.city)
                .trigger('change');
            form.find('#billingZipCode')
                .val(addressObject.zipcode)
                .trigger('change');
            form.find('#billingAddressDistrict')
                .val(addressObject.addressDistrict)
                .trigger('change');
            if (
                addressObject.address1 &&
                addressObject.state &&
                addressObject.addressDistrict &&
                addressObject.zipcode
            ) {
                if (
                    form.find('#billingAddressCity').val() === '' ||
                    form.find('#billingAddressCity').val() === null
                ) {
                    // setting city as per place API response
                    var suburbDropdown = $('.billingAddressCity');
                    suburbDropdown.empty();
                    suburbDropdown.prepend(
                        $('<option>', {
                            value: addressObject.city,
                            text: addressObject.city
                        }).attr('selected', 'selected')
                    );
                    $('.billingAddressCity').removeClass('is-invalid');

                    // setting district as per place API response
                    var billingAddressDistrictDropdown = $(
                        '.billingAddressDistrict'
                    );
                    billingAddressDistrictDropdown.empty();
                    billingAddressDistrictDropdown.prepend(
                        $('<option>', {
                            value: addressObject.addressDistrict,
                            text: addressObject.addressDistrict
                        }).attr('selected', 'selected')
                    );
                    $('.billingAddressDistrict').removeClass('is-invalid');

                    // setting zipcode as per place API response
                    var billingZipcodeDropdown = $('.billingZipCode');
                    billingZipcodeDropdown.empty();
                    billingZipcodeDropdown.prepend(
                        $('<option>', {
                            value: addressObject.zipcode,
                            text: addressObject.zipcode
                        }).attr('selected', 'selected')
                    );
                    $('.billingZipCode').removeClass('is-invalid');
                }
            }                
        });
    },
    initializeAccount: function () {
        var input = document.getElementById('accountAddressAutoComplete');
        var options = {
            placeholder: ' ',
            componentRestrictions: { country: 'NZ' },
            fields: [
                'formatted_address',
                'geometry',
                'name',
                'address_components'
            ],
            strictBounds: false,
            types: ['address']
        };
        var autocomplete = new google.maps.places.Autocomplete(input, options);
        $(input).removeAttr('disabled');
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
                    case 'administrative_area_level_2':
                        addressObject.city = element.long_name;
                        break;
                    case 'administrative_area_level_1':
                        addressObject.state = element.long_name;
                        break;
                    case 'administrative_area_level_3':
                        addressObject.addressDistrict = element.long_name;
                        break;
                    case 'postal_code':
                        addressObject.zipcode = element.long_name;
                        break;
                    default:
                        break;
                }
            }
            var form = $('.address-form');
            form.find('#address1')
                .val(addressObject.address1)
                .trigger('change');
            form.find('#address2')
                .val(addressObject.address2)
                .trigger('change');
            form.find('#state').val(addressObject.state).trigger('change');
            form.find('#city').val(addressObject.city).trigger('change');
            form.find('#shippingAddressDistrict').val(addressObject.addressDistrict).trigger('change');
            form.find('#zipCode').val(addressObject.zipcode).trigger('change');
            if (
                addressObject.address1 &&
                addressObject.state &&
                addressObject.addressDistrict &&
                addressObject.zipcode
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
                    $('.address-district-input').removeClass('is-invalid');

                    // setting zipcode as per place API response
                    var billingZipcodeDropdown = $('.address-zipcode-input');
                    billingZipcodeDropdown.empty();
                    billingZipcodeDropdown.prepend(
                        $('<option>', {
                            value: addressObject.zipcode,
                            text: addressObject.zipcode
                        }).attr('selected', 'selected')
                    );
                    $('.address-zipcode-input').removeClass('is-invalid');
                }
            }
        });
    }
};
