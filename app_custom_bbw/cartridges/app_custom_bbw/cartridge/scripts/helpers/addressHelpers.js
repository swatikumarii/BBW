'use strict';

var base = module.superModule;

/**
 * Verify if the address already exists as a stored user address
 * @param {dw.order.OrderAddress} address - Object that contains shipping address
 * @param {object} storedAddresses - List of stored user addresses
 * @returns {boolean} - Boolean indicating if the address already exists
 */
function checkIfAddressStored(address, storedAddresses) {
    for (var i = 0, l = storedAddresses.length; i < l; i++) {
        if (storedAddresses[i].address1 === address.address1
            && storedAddresses[i].address2 === address.address2
            && storedAddresses[i].postalCode === address.postalCode
            && storedAddresses[i].stateCode === address.states.stateCode
            && storedAddresses[i].city === address.city
            && storedAddresses[i].firstName === address.firstName
            && storedAddresses[i].lastName === address.lastName
            && storedAddresses[i].phone === address.phone
            && storedAddresses[i].dialCode === address.dialCode
            && storedAddresses[i].dialCodeCountry === address.dialCodeCountry) {
            return true;
        }
    }
    return false;
}

/**
 * Generate address name based on the full address object
 * @param {dw.order.OrderAddress} address - Object that contains shipping address
 * @returns {string} - String with the generated address name
 */
function generateAddressName(address) {
    var addressName = address.city ? address.city : address.address1;
    var addressNameExists = request.session.customer.addressBook.getAddress(
        addressName) !== null;
    var count = 1;
    while (addressNameExists) {
        var newAddressName = addressName + '-' + count;
        addressNameExists =
            request.session.customer.addressBook.getAddress(newAddressName) !==
            null;
        if (!addressNameExists) {
            addressName = newAddressName;
        }
        count++;
    }
    return addressName;
}


/**
 * Copy information from address object and save it in the system
 * @param {dw.customer.CustomerAddress} newAddress - newAddress to save information into
 * @param {*} address - Address to copy from
 */
function updateAddressFields(newAddress, address) {
    var Site = require('dw/system/Site');
    var newCreatedAddress = newAddress;
    var defaultDialCode = Site.current.getCustomPreferenceValue('defaultDialCode') || '61';
    var defaultDialCodeCountry = Site.current.getCustomPreferenceValue('defaultDialCodeCountry') || 'au';
    var phoneNumber = '';
    if (address.phone) {
        phoneNumber = address.phone.replace(/[+\-\s()]/g, '');
    }
    newCreatedAddress.setAddress1(address.address1 || '');
    newCreatedAddress.setAddress2(address.address2 || '');
    newCreatedAddress.setCity(address.city || '');
    newCreatedAddress.setFirstName(address.firstName || '');
    newCreatedAddress.setLastName(address.lastName || '');
    newCreatedAddress.setPhone(phoneNumber);
    newCreatedAddress.setPostalCode(address.postalCode || '');

    if (address.states && address.states.stateCode) {
        newCreatedAddress.setStateCode(address.states.stateCode);
    }

    if (address.country) {
        newCreatedAddress.setCountryCode(address.country);
    }

    newCreatedAddress.setJobTitle(address.jobTitle || '');
    newCreatedAddress.setPostBox(address.postBox || '');
    newCreatedAddress.setSalutation(address.salutation || '');
    newCreatedAddress.setSecondName(address.secondName || '');
    newCreatedAddress.setCompanyName(address.companyName || '');
    newCreatedAddress.setSuffix(address.suffix || '');
    newCreatedAddress.setSuite(address.suite || '');
    newCreatedAddress.setTitle(address.title || '');
    newCreatedAddress.custom.dialCode = address.dialCode || defaultDialCode;
    newCreatedAddress.custom.dialCodeCountry = address.dialCodeCountry || defaultDialCodeCountry;
    newCreatedAddress.custom.district = address.district ? address.district : '';
    newCreatedAddress.custom.subDistrict = address.subdistrict ? address.subdistrict : '';
}

/**
 * Stores a new address for a given customer
 * @param {object} address - New address to be saved
 * @param {object} customer - Current customer
 * @param {string} addressId - Id of a new address to be created
 * @param {boolean} shouldSaveAddress - need the address to be created or not
 * @returns {void}
 */
function saveAddress(address, customer, addressId, shouldSaveAddress) {
    var Transaction = require('dw/system/Transaction');
    if (shouldSaveAddress) {
        var addressBook = customer.raw.getProfile().getAddressBook();
        Transaction.wrap(function () {
            var newAddress = addressBook.createAddress(addressId);
            updateAddressFields(newAddress, address);
        });
    }

}

/**
 * Copy dwscript address object into JavaScript object
 * @param {dw.order.OrderAddress} address - Address to be copied
 * @returns {object} - Plain object that represents an address
 */
function copyShippingAddress(address) {
    return {
        address1: address.address1,
        address2: address.address2,
        city: address.city,
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone,
        postalCode: address.postalCode,
        states: {
            stateCode: address.stateCode
        },
        country: address.countryCode,
        jobTitle: address.jobTitle,
        postBox: address.postBox,
        salutation: address.salutation,
        secondName: address.secondName,
        companyName: address.companyName,
        suffix: address.suffix,
        suite: address.suite,
        title: address.title,
        dialCode: address.custom.dialCode,
        dialCodeCountry: address.custom.dialCodeCountry
    };
}

/**
 * Gather all addresses from shipments and return as an array
 * @param {dw.order.Basket} order - current order
 * @returns {Array} - Array of shipping addresses
 */
function gatherShippingAddresses(order) {
    var collections = require('*/cartridge/scripts/util/collections');
    var allAddresses = [];

    if (order.shipments) {
        collections.forEach(order.shipments, function (shipment) {
            if (shipment.shippingAddress) {
                allAddresses.push(copyShippingAddress(shipment.shippingAddress));
            }
        });
    } else {
        allAddresses.push(order.defaultShipment.shippingAddress);
    }
    return allAddresses;
}

module.exports = {
    checkIfAddressStored: checkIfAddressStored,
    generateAddressName: generateAddressName,
    saveAddress: saveAddress,
    updateAddressFields: updateAddressFields,
    gatherShippingAddresses: gatherShippingAddresses
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
