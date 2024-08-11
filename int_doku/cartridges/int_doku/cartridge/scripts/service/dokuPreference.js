/* eslint-disable global-require */
'use strict';

/**
 * Returns Doku custom and hardcoded preferences
 * @returns {Object} custom and hardcoded preferences
 */
function getPreferences() {
  var prefs = {};
  var system = require('dw/system');
  var site = system.Site.getCurrent();
  var URLUtils = require('dw/web/URLUtils');

  // Site custom preferences:
  prefs.dokuPaymentMethods = site.getCustomPreferenceValue('dokuPaymentMethodTypes');
  prefs.paymentDueDate = site.getCustomPreferenceValue('paymentDueDate');
  prefs.client_id = site.getCustomPreferenceValue('dokuClientID');
  prefs.secretKey = site.getCustomPreferenceValue('dokuClientSecret');
  prefs.request_Id = site.getCustomPreferenceValue('dokuRequest_Id');
  prefs.TransactionSuccess = 'SUCCESS';
  prefs.TransactionPending = 'PENDING';
  prefs.TransactionFailed = 'FAILED';
  prefs.TransactionExpired = 'EXPIRED';
  prefs.TransactionTimeout = 'TIMEOUT';
  prefs.merchantReturnUrl =  'Doku-Callback';
  prefs.merchantId = site.getCustomPreferenceValue('ovoMerchantId');
  prefs.storeCode = site.getCustomPreferenceValue('ovoStoreCode');
  prefs.mid = site.getCustomPreferenceValue('ovoMid');
  prefs.tid = site.getCustomPreferenceValue('ovoTid');

  return prefs;
}

module.exports = getPreferences();
