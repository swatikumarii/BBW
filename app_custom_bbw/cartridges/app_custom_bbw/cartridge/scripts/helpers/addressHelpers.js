'use strict';

var base = module.superModule;

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

module.exports = {
    generateAddressName: generateAddressName
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
