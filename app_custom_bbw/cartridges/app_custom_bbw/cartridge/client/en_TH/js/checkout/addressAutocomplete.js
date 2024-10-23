'use strict';

module.exports = {
    initialize: function () {
        var input = document.getElementById('shippingAddressAutoComplete');
        var options = {
            placeholder: ' ',
            componentRestrictions: { country: 'TH' },
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
                        if (element.long_name.includes('Khet ')) {
                            addressObject.city = element.long_name.replace('Khet ', '');
                        } else {
                            addressObject.city = element.long_name;
                        } 
                        break;
                    case 'administrative_area_level_2':
                        if (element.long_name.includes('Amphoe ')) {
                            addressObject.city = element.long_name.replace('Amphoe ', '');
                        } else {
                            addressObject.city = element.long_name;
                        } 
                        break;
                    case 'sublocality_level_2':
                        if (element.long_name.includes('Khwaeng ')) {
                            addressObject.shippingAddressSubdistrict = element.long_name.replace('Khwaeng ', '');
                        } else {
                            addressObject.shippingAddressSubdistrict = element.long_name;
                        } 
                        break;
                    case 'locality':
                        if (element.long_name.includes('Tambon ')) {
                            addressObject.shippingAddressSubdistrict = element.long_name.replace('Tambon ', '');
                        } else {
                            addressObject.shippingAddressSubdistrict = element.long_name;
                        } 
                        break;
                    case 'administrative_area_level_1':
                        if (element.long_name.includes('Chang Wat ')) {
                            addressObject.state = element.long_name.replace('Chang Wat ', '');
                        } else {
                            addressObject.state = element.long_name;
                        } 
                        if (addressObject.state === 'Krung Thep Maha Nakhon') {
                            addressObject.state = 'Bangkok';
                        }
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
            // if (
            //     addressObject.address1 &&
            //     addressObject.state &&
            //     addressObject.shippingAddressSubdistrict &&
            //     addressObject.zipcode
            // ) {
            //     if (
            //         form.find('#shippingAddressCitydefault').val() === '' ||
            //         form.find('#shippingAddressCitydefault').val() === null
            //     ) {
            //         // setting city as per place API response
            //         var suburbDropdown = $('.shippingAddressCity');
            //         suburbDropdown.empty();
            //         suburbDropdown.prepend(
            //             $('<option>', {
            //                 value: addressObject.city,
            //                 text: addressObject.city
            //             }).attr('selected', 'selected')
            //         );
            //         var cityError = $('#defaultCity');
            //         cityError.empty();
            //         $('.shippingAddressCity').removeClass('is-invalid');

            //         // setting subdistrict as per place API response
            //         var shippingAddressSubDistrictDropdown = $('.shippingAddressSubdistrict');
            //         shippingAddressSubDistrictDropdown.empty();
            //         shippingAddressSubDistrictDropdown.prepend(
            //             $('<option>', {
            //                 value: addressObject.shippingAddressSubdistrict,
            //                 text: addressObject.shippingAddressSubdistrict
            //             }).attr('selected', 'selected')
            //         );
            //         var shippingAddressSubDistrictError = $('#defaultSubdistrict');
            //         shippingAddressSubDistrictError.empty();
            //         $('.shippingAddressSubdistrict').removeClass('is-invalid');

            //         // setting zipcode as per place API response
            //         var zipcodeDropdown = $('.shippingZipCode');
            //         zipcodeDropdown.empty();
            //         zipcodeDropdown.prepend(
            //             $('<option>', {
            //                 value: addressObject.zipcode,
            //                 text: addressObject.zipcode
            //             }).attr('selected', 'selected')
            //         );
            //         var zipcodeError = $('#defaultZipCode');
            //         zipcodeError.empty();
            //         $('.shippingZipCode').removeClass('is-invalid');
            //     }
            // }
        });
    },
    initializeBilling: function () {
        var input = document.getElementById('billingAddressAutoComplete');
        var options = {
            placeholder: ' ',
            componentRestrictions: { country: 'TH' },
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
                        if (element.long_name.includes('Khet ')) {
                            addressObject.city = element.long_name.replace(
                                'Khet ',
                                ''
                            );
                        } else {
                            addressObject.city = element.long_name;
                        }
                        break;
                    case 'administrative_area_level_2':
                        if (element.long_name.includes('Amphoe ')) {
                            addressObject.city = element.long_name.replace(
                                'Amphoe ',
                                ''
                            );
                        } else {
                            addressObject.city = element.long_name;
                        }
                        break;
                    case 'sublocality_level_2':
                        if (element.long_name.includes('Khwaeng ')) {
                            addressObject.shippingAddressSubdistrict =
                                element.long_name.replace('Khwaeng ', '');
                        } else {
                            addressObject.shippingAddressSubdistrict =
                                element.long_name;
                        }
                        break;
                    case 'locality':
                        if (element.long_name.includes('Tambon ')) {
                            addressObject.shippingAddressSubdistrict =
                                element.long_name.replace('Tambon ', '');
                        } else {
                            addressObject.shippingAddressSubdistrict =
                                element.long_name;
                        }
                        break;
                    case 'administrative_area_level_1':
                        if (element.long_name.includes('Chang Wat ')) {
                            addressObject.state = element.long_name.replace(
                                'Chang Wat ',
                                ''
                            );
                        } else {
                            addressObject.state = element.long_name;
                        }
                        if (addressObject.state === 'Krung Thep Maha Nakhon') {
                            addressObject.state = 'Bangkok';
                        }
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
                .val(addressObject.shippingAddressSubdistrict)
                .trigger('change');
            // if (
            //     addressObject.address1 &&
            //     addressObject.state &&
            //     addressObject.addressSubdistrict &&
            //     addressObject.zipcode
            // ) {
            //     if (
            //         form.find('#billingAddressCity').val() === '' ||
            //         form.find('#billingAddressCity').val() === null
            //     ) {
            //         // setting city as per place API response
            //         var suburbDropdown = $('.billingAddressCity');
            //         suburbDropdown.empty();
            //         suburbDropdown.prepend(
            //             $('<option>', {
            //                 value: addressObject.city,
            //                 text: addressObject.city
            //             }).attr('selected', 'selected')
            //         );
            //         $('.billingAddressCity').removeClass('is-invalid');


            //         // setting subdistrict as per place API response
            //         var billingAddressSubDistrictDropdown = $(
            //             '.billingAddressSubdistrict'
            //         );
            //         billingAddressSubDistrictDropdown.empty();
            //         billingAddressSubDistrictDropdown.prepend(
            //             $('<option>', {
            //                 value: addressObject.addressSubdistrict,
            //                 text: addressObject.addressSubdistrict
            //             }).attr('selected', 'selected')
            //         );
            //         $('.billingAddressSubdistrict').removeClass('is-invalid');

            //         // setting zipcode as per place API response
            //         var billingZipcodeDropdown = $('.billingZipCode');
            //         billingZipcodeDropdown.empty();
            //         billingZipcodeDropdown.prepend(
            //             $('<option>', {
            //                 value: addressObject.zipcode,
            //                 text: addressObject.zipcode
            //             }).attr('selected', 'selected')
            //         );
            //         $('.billingZipCode').removeClass('is-invalid');
            //     }
            // }                
        });
    },
    initializeAccount: function () {
        var input = document.getElementById('accountAddressAutoComplete');
        var options = {
            placeholder: ' ',
            componentRestrictions: { country: 'TH' },
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
                        if (element.long_name.includes('Khet ')) {
                            addressObject.city = element.long_name.replace(
                                'Khet ',
                                ''
                            );
                        } else {
                            addressObject.city = element.long_name;
                        }
                        break;
                    case 'administrative_area_level_2':
                        if (element.long_name.includes('Amphoe ')) {
                            addressObject.city = element.long_name.replace(
                                'Amphoe ',
                                ''
                            );
                        } else {
                            addressObject.city = element.long_name;
                        }
                        break;
                    case 'sublocality_level_2':
                        if (element.long_name.includes('Khwaeng ')) {
                            addressObject.shippingAddressSubdistrict =
                                element.long_name.replace('Khwaeng ', '');
                        } else {
                            addressObject.shippingAddressSubdistrict =
                                element.long_name;
                        }
                        break;
                    case 'locality':
                        if (element.long_name.includes('Tambon ')) {
                            addressObject.shippingAddressSubdistrict =
                                element.long_name.replace('Tambon ', '');
                        } else {
                            addressObject.shippingAddressSubdistrict =
                                element.long_name;
                        }
                        break;
                    case 'administrative_area_level_1':
                        if (element.long_name.includes('Chang Wat ')) {
                            addressObject.state = element.long_name.replace(
                                'Chang Wat ',
                                ''
                            );
                        } else {
                            addressObject.state = element.long_name;
                        }
                        if (addressObject.state === 'Krung Thep Maha Nakhon') {
                            addressObject.state = 'Bangkok';
                        }
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
            form.find('#shippingAddressSubdistrict').val(addressObject.shippingAddressSubdistrict).trigger('change');
            form.find('#zipCode').val(addressObject.zipcode).trigger('change');
            // if (
            //     addressObject.address1 &&
            //     addressObject.state &&
            //     addressObject.addressSubdistrict &&
            //     addressObject.zipcode
            // ) {
            //     if (
            //         form.find('#city').val() === '' ||
            //         form.find('#city').val() === null
            //     ) {
            //         // setting city as per place API response
            //         var suburbDropdown = $('.address-city-input');
            //         suburbDropdown.empty();
            //         suburbDropdown.prepend(
            //             $('<option>', {
            //                 value: addressObject.city,
            //                 text: addressObject.city
            //             }).attr('selected', 'selected')
            //         );
            //         $('.address-city-input').removeClass('is-invalid');

            //         // setting subdistrict as per place API response
            //         var billingAddressSubDistrictDropdown = $(
            //             '.address-subdistrict-input'
            //         );
            //         billingAddressSubDistrictDropdown.empty();
            //         billingAddressSubDistrictDropdown.prepend(
            //             $('<option>', {
            //                 value: addressObject.addressSubdistrict,
            //                 text: addressObject.addressSubdistrict
            //             }).attr('selected', 'selected')
            //         );
            //         $('.address-subdistrict-input').removeClass('is-invalid');

            //         // setting zipcode as per place API response
            //         var billingZipcodeDropdown = $('.address-zipcode-input');
            //         billingZipcodeDropdown.empty();
            //         billingZipcodeDropdown.prepend(
            //             $('<option>', {
            //                 value: addressObject.zipcode,
            //                 text: addressObject.zipcode
            //             }).attr('selected', 'selected')
            //         );
            //         $('.address-zipcode-input').removeClass('is-invalid');
            //     }
            // }
        });
    }
};
