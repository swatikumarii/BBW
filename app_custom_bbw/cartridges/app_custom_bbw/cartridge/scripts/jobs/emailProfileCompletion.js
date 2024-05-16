'use strict';

/**
 * @description This function is run by the job to send email
 * to the users profile is not completed
 */
function completeProfile() {
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var collections = require('*/cartridge/scripts/util/collections');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var sendProfileCompletionReminderEmail = dw.system.Site.getCurrent().getCustomPreferenceValue(
        'sendProfileCompletionReminderEmail'
    );
    if (sendProfileCompletionReminderEmail) {
        var incompleteProfiles = CustomerMgr.queryProfiles('custom.isProfileComplete = {0} or custom.isProfileComplete = {1}', null, false, null);
        collections.map(incompleteProfiles, function (profile) {
            var emailObj = {
                to: profile.email,
                subject: Resource.msg('subject.profile.incomplete.email', 'account', null),
                from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com'
            };
            var emailTemplate = 'mail/profileCompletion/sendEmailProfileCompletion';
            emailHelpers.sendEmail(emailObj, emailTemplate);
        }
        );
    }
}

module.exports = {
    completeProfile: completeProfile
};
