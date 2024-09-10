'use strict';

/**
 * Returns eGHL custom and hardcoded preferences
 * @returns {Object} custom and hardcoded preferences
 */
function getPreferences() {
    var prefs = {};
    var system = require('dw/system');
    var site = system.Site.getCurrent();
    var URLUtils = require('dw/web/URLUtils');

    // Site custom preferences:
    prefs.paymentMethod = site.getCustomPreferenceValue('eghlPaymentMethod');
    prefs.transactionType = site.getCustomPreferenceValue('eghlTransactionType');
    prefs.merchantReturnUrl = URLUtils.abs(site.getCustomPreferenceValue('eghlMerchantReturnUrl'));
    prefs.currencyCode = site.getCustomPreferenceValue('eghlCurrencyCode');
    prefs.merchantName = site.getCustomPreferenceValue('eghlMerchantName');
    prefs.merchantCallBackUrl = URLUtils.abs(site.getCustomPreferenceValue('eghlMerchantCallBackUrl'));
    prefs.pageTimeOut = site.getCustomPreferenceValue('eghlPageTimeOut');
    prefs.txnSuccessStatus = '0';
    prefs.txnFailedStatus = '1';
    prefs.txnPendingStatus = '2';
    prefs.queryTransactionType = 'QUERY';
    prefs.txnExists = '0';
    prefs.txnNotExists = '1';
    prefs.txnInternalError = '2';

    return prefs;
}

module.exports = getPreferences();
