'use strict';

var baseAddress = require('base/checkout/address');

/**
 * Populate the Billing Address Summary View
 * @param {string} parentSelector - the top level DOM selector for a unique address summary
 * @param {object} address - the address data
 */
function populateAddressSummary(parentSelector, address) {
    $.each(address, function (attr) {
        var val = address[attr];
        if (attr === 'countryCode' && typeof val === 'object' && val.value === 'AU') {
            val = 'Australia';
        }
        $('.' + attr, parentSelector).text(val || '');
    });
};


baseAddress.methods.populateAddressSummary = populateAddressSummary;

module.exports = baseAddress;
