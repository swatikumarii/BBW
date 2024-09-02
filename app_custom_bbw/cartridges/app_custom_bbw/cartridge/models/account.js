'use strict';

var base = module.superModule;
var Site = require('dw/system/Site');

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
        var defaultDialCode = Site.current.getCustomPreferenceValue('defaultDialCode') || '61';
        var defaultDialCodeCountry = Site.current.getCustomPreferenceValue('defaultDialCodeCountry') || 'au';
        if (currentCustomer.raw.profile) {
            this.profile.birthday = currentCustomer.raw.profile.birthday;
            this.profile.zipCode = currentCustomer.raw.profile.custom.zipCode;
            this.profile.nationality = currentCustomer.raw.profile.custom.nationality;
            this.profile.gender = currentCustomer.raw.profile.gender.value;
            this.profile.salutation = currentCustomer.raw.profile.salutation;
            this.profile.isProfileComplete =
                currentCustomer.raw.profile.custom.isProfileComplete;
            this.profile.dialCode = currentCustomer.raw.profile.custom.dialCode ? currentCustomer.raw.profile.custom.dialCode : defaultDialCode;
            this.profile.dialCodeCountry = currentCustomer.raw.profile.custom.dialCodeCountry ? currentCustomer.raw.profile.custom.dialCodeCountry : defaultDialCodeCountry;
        }
    }
};

account.getCustomerPaymentInstruments = base.getCustomerPaymentInstruments;

module.exports = account;
