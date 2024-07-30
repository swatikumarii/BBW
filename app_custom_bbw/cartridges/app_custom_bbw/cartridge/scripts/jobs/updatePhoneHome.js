'use strict';

var Transaction = require('dw/system/Transaction');

/**
 * @description This function is run by the job to update phone home field.
 */
function execute() {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var query =
        'custom.migratedCustomer = null or custom.migratedCustomer = false';
    var customerProfiles = CustomerMgr.queryProfiles(query, null, null, 1, 1);

    Transaction.wrap(function () {
        while (customerProfiles !== null && customerProfiles.hasNext()) {
            var cp = customerProfiles.next();
            cp.custom.dialCode = '61';
            if (cp.phoneHome) {
                while (cp.phoneHome.startsWith('0')) {
                    cp.phoneHome = cp.phoneHome.substr(1);
                }
                cp.phoneHome = cp.phoneHome.split(' ').join('');
            }
        }
    });
}

module.exports = {
    execute: execute
};
