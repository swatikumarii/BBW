'use strict';

/**
 * Returns sendgrid custom and hardcoded preferences
 * @returns {Object} custom and hardcoded preferences
 */
function getPreferences() {
    var prefs = {};
    var system = require('dw/system');
    var site = system.Site.getCurrent();

    // Site custom preferences:
    prefs.isSendgridEnable = site.getCustomPreferenceValue('isSendgridEnable');
    prefs.sendgridApiKey = site.getCustomPreferenceValue('sendgridApiKey');
    prefs.sendgridFromEmail = site.getCustomPreferenceValue('sendgridFromEmail');

    return prefs;
}

module.exports = getPreferences();
