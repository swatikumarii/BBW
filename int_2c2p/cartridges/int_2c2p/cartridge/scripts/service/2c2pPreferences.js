/* eslint-disable global-require */
'use strict';

/**
 * Returns HSBC custom and hardcoded preferences
 * @returns {Object} custom and hardcoded preferences
 */
function getPreferences() {
  var prefs = {};
  var system = require('dw/system');
  var site = system.Site.getCurrent();
  var URLUtils = require('dw/web/URLUtils');

  // Site custom preferences:
  prefs.hsbcPaymentChannel = site.getCustomPreferenceValue('hsbcPaymentChannel');
  prefs.hsbcMerchantID = site.getCustomPreferenceValue('hsbcMerchantID');
  prefs.hsbcClient_id = site.getCustomPreferenceValue('hsbcClient_id');
  prefs.hsbcClientSecret = site.getCustomPreferenceValue('hsbcClientSecret');
  prefs.hsbcJWS = site.getCustomPreferenceValue('hsbcJWS');
  prefs.hsbcJWE = site.getCustomPreferenceValue('hsbcJWE');
  prefs.hsbcEncrypt = site.getCustomPreferenceValue('hsbcEncrypt');
  prefs.hsbcMerchantNotificationUrl = URLUtils.abs(site.getCustomPreferenceValue('hsbcMerchantNotificationUrl')).toString();
  prefs.hsbcMerchantCallBackUrl = site.getCustomPreferenceValue('hsbcMerchantCallBackUrl');
  prefs.hsbcAuthorizationHeader = site.getCustomPreferenceValue('hsbcAuthorizationHeader');
  prefs.TransactionSuccess = 'SUCCESS';
  prefs.TransactionPending = 'PENDING';
  prefs.TransactionFailed = 'FAILED';
  prefs.TransactionExpired = 'EXPIRED';
  prefs.TransactionTimeout = 'TIMEOUT';
  prefs.TransactionVoided = 'VOIDED';
  prefs.TransactionPaid = 'PAID';
  prefs.TransactionCaptured = 'CAPTURED';
  prefs.TransactionSettled = 'SETTLED';

  return prefs;
}

module.exports = getPreferences();
