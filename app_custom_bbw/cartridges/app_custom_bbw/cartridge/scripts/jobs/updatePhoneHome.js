'use strict';

var Transaction = require('dw/system/Transaction');

/**
 * Correct phone number
 * @param {string} phoneNo - Phone number
 * @returns {string} phoneNo
 */
function correctPhoneNo(phoneNo) {
    var phoneNumber = phoneNo;
    if (phoneNumber) {
        if (phoneNumber.startsWith('0')) {
            phoneNumber = phoneNumber.substr(1);
        }
        phoneNumber = phoneNumber.split(' ').join('');
    }
    return phoneNumber;
}

/**
 * @description This function is run by the job to update phone home field.
 */
function execute() {
    var Site = require('dw/system/Site');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var collections = require('*/cartridge/scripts/util/collections');

    var defaultDialCode =
        Site.current.getCustomPreferenceValue('defaultDialCode');
    var defaultDialCodeCountry = Site.current.getCustomPreferenceValue(
        'defaultDialCodeCountry'
    );
    var query =
        'custom.migratedCustomer = null or custom.migratedCustomer = false';
    var customerProfiles = CustomerMgr.queryProfiles(query, null, null, 1, 1);

    Transaction.wrap(function () {
        while (customerProfiles !== null && customerProfiles.hasNext()) {
            var cp = customerProfiles.next();
            cp.custom.dialCode = defaultDialCode;
            cp.custom.dialCodeCountry = defaultDialCodeCountry;
            cp.phoneHome = correctPhoneNo(cp.phoneHome);

            var customer = CustomerMgr.getCustomerByCustomerNumber(
                cp.customerNo
            );
            var rawAddressBook = customer.addressBook.getAddresses();
            collections.forEach(rawAddressBook, function (rawAddress) {
                // eslint-disable-next-line
                rawAddress.custom.dialCode = defaultDialCode;
                // eslint-disable-next-line
                rawAddress.custom.dialCodeCountry = defaultDialCodeCountry;
                // eslint-disable-next-line
                rawAddress.phone = correctPhoneNo(rawAddress.phone);
            });
        }
    });
}

module.exports = {
    execute: execute
};
