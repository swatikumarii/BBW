'use strict';

var base = module.superModule;

module.exports = function account(currentCustomer, addressModel, orderModel) {
    base.call(this, currentCustomer, addressModel, orderModel);

    // Push custom attr in profile object to show on profile pages
    if (Object.prototype.hasOwnProperty.call(currentCustomer, 'raw')) {
        if (currentCustomer.raw.profile) {
            this.profile.birthday = currentCustomer.raw.profile.birthday;
            this.profile.zipCode = currentCustomer.raw.profile.custom.zipCode;
        }
    }
};
