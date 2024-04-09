'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');

// Function used to check the notify me threshold after 
// factoring in reserve outofstock value.
exports.getThresholdWithReserveStock = function (pid) {
    var product = ProductMgr.getProduct(pid);
    var productLevelReserveQty =
        'custom' in product &&
        'reserveQty' in product.custom &&
        product.custom.reserveQty
            ? product.custom.reserveQty
            : 0;
    var globalLevelReserveQty =
        dw.system.Site.getCurrent().getCustomPreferenceValue('reserveQty');
    var reserveOosQty = productLevelReserveQty || globalLevelReserveQty;
    var notifyEmailThreshold = Site.getCurrent().getCustomPreferenceValue(
        'notifyEmailThreshold'
    );
    var productLevelnotifyMeThreshold =
        'custom' in product &&
        'notifyMeThreshold' in product.custom &&
        product.custom.notifyMeThreshold
            ? product.custom.notifyMeThreshold
            : false;
    var threshold = productLevelnotifyMeThreshold || notifyEmailThreshold;
    
    return reserveOosQty + threshold;
};
