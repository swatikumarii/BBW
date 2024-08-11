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
            && storedAddresses[i].phone === address.phone) {
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
    newAddress.setAddress1(address.address1 || '');
    newAddress.setAddress2(address.address2 || '');
    newAddress.setCity(address.city || '');
    newAddress.setFirstName(address.firstName || '');
    newAddress.setLastName(address.lastName || '');
    newAddress.setPhone(address.phone || '');
    newAddress.setPostalCode(address.postalCode || '');

    if (address.states && address.states.stateCode) {
        newAddress.setStateCode(address.states.stateCode);
    }

    if (address.country) {
        newAddress.setCountryCode(address.country);
    }
    newAddress.custom.district = address.district ? address.district : '';
    newAddress.custom.subDistrict = address.subdistrict ? address.subdistrict : '';
    newAddress.setJobTitle(address.jobTitle || '');
    newAddress.setPostBox(address.postBox || '');
    newAddress.setSalutation(address.salutation || '');
    newAddress.setSecondName(address.secondName || '');
    newAddress.setCompanyName(address.companyName || '');
    newAddress.setSuffix(address.suffix || '');
    newAddress.setSuite(address.suite || '');
    newAddress.setTitle(address.title || '');
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

module.exports = {
    checkIfAddressStored: checkIfAddressStored,
    generateAddressName: generateAddressName,
    saveAddress: saveAddress,
    updateAddressFields: updateAddressFields
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
