'use strict';

module.exports = {
    initialize : function () {
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
                    case 'route':
                        addressObject.address1 = element.long_name;
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
            if (place.name !== addressObject.address1) {
                addressObject.address1 =
                    place.name + ', ' + addressObject.address1;
            }
            var form = $('.shipping-form');
            form.find('#shippingAddressOnedefault').val(addressObject.address1).trigger('change');
            form.find('#shippingAddressTwodefault').val(addressObject.address2).trigger('change');
            form.find('#shippingStatedefault').val(addressObject.state).trigger('change');
            form.find('#shippingAddressCitydefault').val(addressObject.city).trigger('change');
            form.find('#shippingZipCodedefault').val(addressObject.zipcode).trigger('change');
        });
    }
};
