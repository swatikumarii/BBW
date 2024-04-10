'use strict';

var Site = require('dw/system/Site');

// Function used to check the notify me threshold after 
// factoring in reserve outofstock value.
exports.getThresholdWithReserveStock = function (product) {
    var productLevelReserveQty = product.reserveQty;
    var globalLevelReserveQty =
        dw.system.Site.getCurrent().getCustomPreferenceValue('reserveQty');
    var reserveOosQty = productLevelReserveQty || globalLevelReserveQty;
    var notifyEmailThreshold = Site.getCurrent().getCustomPreferenceValue(
        'notifyEmailThreshold'
    );
    var productLevelnotifyMeThreshold = product.notifyMeThreshold;
    var threshold = productLevelnotifyMeThreshold || notifyEmailThreshold;
    return reserveOosQty + threshold;
};
