'use strict';

// dw imports
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var CustomerMgr = require('dw/customer/CustomerMgr');
var capillaryAPI = require('*/cartridge/scripts/service/capillaryApis');


/**
 * This function is using to create customer on capillary
 * @returns {any} Status with ok/error
 */
function execute() {
    try {
        // fetch customers whose don't have capillaryCustomerID in profile
        var customerList = CustomerMgr.searchProfiles('custom.capillaryFailed = {0}', 'lastModified desc', true);
        // Loop through the customer and process them as needed
        Transaction.wrap(function () {
            while (customerList.hasNext()) {
                var customerProfile = customerList.next();
                // Capillary: create customer service
                var customerData = {
                    firstName : customerProfile.firstName ? customerProfile.firstName : '',
                    lastName: customerProfile.lastName ? customerProfile.lastName : '',
                    phone: customerProfile.phoneHome,
                    email: customerProfile.email,
                    gender: customerProfile.gender ? customerProfile.gender.value : '',
                    birthday: customerProfile.birthday ? customerProfile.birthday : ''
                };
                var crmCustomerID = capillaryAPI.createCustomer(customerData, customerProfile);
                if (crmCustomerID) {
                    customerProfile.custom.capillaryCustomerID = crmCustomerID;
                    customerProfile.custom.capillaryResponse = '';
                    customerProfile.custom.capillaryFailed = false;
                }
            }
        });
        return new Status(Status.OK);
    } catch (exception) {
        return new Status(Status.ERROR, null, 'There was an error while executing capillary job step: createCustomers');
    }
}
module.exports = {
    execute: execute
};
