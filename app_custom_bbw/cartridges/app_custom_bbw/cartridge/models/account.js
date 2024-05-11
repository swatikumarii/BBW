'use strict';

var base = module.superModule;

/**
 * Account class that represents the current customer's profile dashboard
 * @param {object} currentCustomer - Current customer
 * @param {object} addressModel - The current customer's preferred address
 * @param {object} orderModel - The current customer's order history
 * @class
 */
function account(currentCustomer, addressModel, orderModel) {
    base.call(this, currentCustomer, addressModel, orderModel);

    // Push custom attr in profile object to show on profile pages
    if (Object.prototype.hasOwnProperty.call(currentCustomer, 'raw')) {
        if (currentCustomer.raw.profile) {
            this.profile.birthday = currentCustomer.raw.profile.birthday;
            this.profile.zipCode = currentCustomer.raw.profile.custom.zipCode;
        }
    }
};


base.account = account;

module.exports = base;
