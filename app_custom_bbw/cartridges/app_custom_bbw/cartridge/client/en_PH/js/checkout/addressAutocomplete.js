'use strict';

module.exports = {
    initialize: function () {
        var input = document.getElementById('shippingAddressAutoComplete');
        var options = {
            placeholder: ' ',
            componentRestrictions: { country: 'PH' },
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
        autocomplete.addListener('place_changed', function () {
            var place = autocomplete.getPlace();
            var components = place.address_components;
            var addressObject = {};
            var isStateSet = false;
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
                        if (!isStateSet) {
                            addressObject.state = element.long_name;
                        }
                        break;
                    case 'administrative_area_level_2':
                        addressObject.state = element.long_name;
                        isStateSet = true;
                        break;
                    case 'administrative_area_level_4':
                        addressObject.shippingAddressSubdistrict =
                            element.long_name;
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
            form.find('#shippingAddressSubdistrictdefault')
                .val(addressObject.shippingAddressSubdistrict)
                .trigger('change');
        });
    },
    initializeBilling: function () {
        var input = document.getElementById('billingAddressAutoComplete');
        var options = {
            placeholder: ' ',
            componentRestrictions: { country: 'PH' },
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
        autocomplete.addListener('place_changed', function () {
            var place = autocomplete.getPlace();
            var components = place.address_components;
            var addressObject = {};
            var isStateSet = false;
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
                        if (!isStateSet) {
                            addressObject.state = element.long_name;
                        }
                        break;
                    case 'administrative_area_level_2':
                        addressObject.state = element.long_name;
                        isStateSet = true;
                        break;
                    case 'administrative_area_level_4':
                        addressObject.addressSubdistrict = element.long_name;
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
            form.find('#billingAddressSubdistrict')
                .val(addressObject.addressSubdistrict)
                .trigger('change');             
        });
    },
    initializeAccount: function () {
        var input = document.getElementById('accountAddressAutoComplete');
        var options = {
            placeholder: ' ',
            componentRestrictions: { country: 'PH' },
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
        autocomplete.addListener('place_changed', function () {
            var place = autocomplete.getPlace();
            var components = place.address_components;
            var addressObject = {};
            var isStateSet = false;
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
                        if (!isStateSet) {
                            addressObject.state = element.long_name;
                        }
                        break;
                    case 'administrative_area_level_2':
                        addressObject.state = element.long_name;
                        isStateSet = true;
                        break;
                    case 'administrative_area_level_4':
                        addressObject.addressSubdistrict = element.long_name;
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
            form.find('#subDistrict').val(addressObject.addressSubdistrict).trigger('change');
            form.find('#zipCode').val(addressObject.zipcode).trigger('change');
        });
    }
};
