'use strict';

var Transaction = require('dw/system/Transaction');

/**
 * @param {string} stateName - StateName
 * @returns {boolean} valid or not
 * @description This function is run by the job to update address field to state code.
 */
function getStateCode(stateName) {
    switch (stateName) {
        case 'Australian Capital Territory':
            return 'ACT';
        case 'New South Wales':
            return 'NSW';
        case 'Northern Territory':
            return 'NT';
        case 'Queensland':
            return 'QLD';
        case 'South Australia':
            return 'SA';
        case 'Tasmania':
            return 'TAS';
        case 'Victoria':
            return 'VIC';
        case 'Western Australia':
            return 'WA';
        default:
            return stateName;
    }
}

/**
 * @description This function is run by the job to update address field.
 */
function execute() {
    var collections = require('*/cartridge/scripts/util/collections');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var customerProfiles = CustomerMgr.searchProfiles(
        'creationDate >= {0}', // Example: filter by email domain
        null,
        new Date(2000, 0, 1)
    );

    Transaction.wrap(function () {
        while (customerProfiles.hasNext()) {
            var customer = customerProfiles.next();
            var addresses = customer.addressBook.addresses;
            collections.forEach(addresses, function (rawAddress) {
                // eslint-disable-next-line
                rawAddress.stateCode = getStateCode(rawAddress.stateCode);
            });
        }
    });
}

module.exports = {
    execute: execute
};
