'use strict';

var Site = require('dw/system/Site');
/**
 * creates a plain object that contains address information
 * @param {dw.order.OrderAddress} addressObject - User's address
 * @returns {object} an object that contains information about the users address
 */
function createAddressObject(addressObject) {
    var result;
    if (addressObject) {
        result = {
            address1: addressObject.address1,
            address2: addressObject.address2,
            city: addressObject.city,
            firstName: addressObject.firstName,
            lastName: addressObject.lastName,
            ID: Object.hasOwnProperty.call(addressObject, 'ID')
                ? addressObject.ID : null,
            addressId: Object.hasOwnProperty.call(addressObject, 'ID')
                ? addressObject.ID : null,
            phone: addressObject.phone,
            postalCode: addressObject.postalCode,
            stateCode: addressObject.stateCode,
            jobTitle: addressObject.jobTitle,
            postBox: addressObject.postBox,
            salutation: addressObject.salutation,
            secondName: addressObject.secondName,
            companyName: addressObject.companyName,
            suffix: addressObject.suffix,
            suite: addressObject.suite,
            title: addressObject.title
        };

        if (addressObject.custom && 'district' in addressObject.custom && addressObject.custom.district) {
            var district = addressObject.custom.district;
            result.district = district;
        }

        if (addressObject.custom && 'subDistrict' in addressObject.custom && addressObject.custom.subDistrict) {
            var subDistrict = addressObject.custom.subDistrict;
            result.subDistrict = subDistrict;
        }

        if (result.stateCode === 'undefined') {
            result.stateCode = '';
        }

        if (Object.hasOwnProperty.call(addressObject, 'countryCode')) {
            result.countryCode = {
                displayValue: addressObject.countryCode.displayValue,
                value: addressObject.countryCode.value.toUpperCase()
            };
        }
        var defaultDialCode = Site.current.getCustomPreferenceValue('defaultDialCode') || '61';
        var defaultDialCodeCountry = Site.current.getCustomPreferenceValue('defaultDialCodeCountry') || 'au';
        if ('raw' in addressObject) {
            result.dialCode = addressObject.raw.custom.dialCode ? addressObject.raw.custom.dialCode : defaultDialCode;
            result.dialCodeCountry = addressObject.raw.custom.dialCodeCountry ? addressObject.raw.custom.dialCodeCountry : defaultDialCodeCountry;
        } else {
            result.dialCode = addressObject.custom.dialCode ? addressObject.custom.dialCode : defaultDialCode;
            result.dialCodeCountry = addressObject.custom.dialCodeCountry ? addressObject.custom.dialCodeCountry : defaultDialCodeCountry;
        }
    } else {
        result = null;
    }
    return result;
}

/**
 * Address class that represents an orderAddress
 * @param {dw.order.OrderAddress} addressObject - User's address
 * @class
 */
function address(addressObject) {
    this.address = createAddressObject(addressObject);
}

module.exports = address;
