'use strict';

module.exports = {
    initialize: function () {
        var input = document.getElementById('shippingAddressAutoComplete');
        var options = {
            placeholder: ' ',
            componentRestrictions: { country: 'AU' },
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
            for (var index = 0; index < components.length; index++) {
                var element = components[index];
                switch (element.types[0]) {
                    case 'street_number':
                        addressObject.address1 = element.long_name + ' ';
                        break;
                    case 'route':
                        if(addressObject.address1) {
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
        });
    },
    initializeBilling: function () {
        var input = document.getElementById('billingAddressAutoComplete');
        var options = {
            placeholder: ' ',
            componentRestrictions: { country: 'AU' },
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
            for (var index = 0; index < components.length; index++) {
                var element = components[index];
                switch (element.types[0]) {
                    case 'street_number':
                        addressObject.address1 = element.long_name + ' ';
                        break;
                    case 'route':
                        if(addressObject.address1) {
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
        });
    }
};
