'use strict';

var base = module.superModule;
var Site = require('dw/system/Site');

/**
 * Address class that represents an orderAddress
 * @param {dw.order.OrderAddress} addressObject - User's address
 * @class
 */
function address(addressObject) {
    base.call(this, addressObject);
    if (this.address !== null) {
        var defaultDialCode = Site.current.getCustomPreferenceValue('defaultDialCode') || '61';
        var defaultDialCodeCountry = Site.current.getCustomPreferenceValue('defaultDialCodeCountry') || 'au';
        if ('raw' in addressObject) {
            this.address.dialCode = addressObject.raw.custom.dialCode ? addressObject.raw.custom.dialCode : defaultDialCode;
            this.address.dialCodeCountry = addressObject.raw.custom.dialCodeCountry ? addressObject.raw.custom.dialCodeCountry : defaultDialCodeCountry;
        } else {
            this.address.dialCode = addressObject.custom.dialCode ? addressObject.custom.dialCode : defaultDialCode;
            this.address.dialCodeCountry = addressObject.custom.dialCodeCountry ? addressObject.custom.dialCodeCountry : defaultDialCodeCountry;
        }
    }
}

module.exports = address;
