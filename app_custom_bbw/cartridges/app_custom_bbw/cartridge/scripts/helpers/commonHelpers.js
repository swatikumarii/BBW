/* eslint-disable no-mixed-spaces-and-tabs */
'use strict';

var Resource = require('dw/web/Resource');

/**
 * sendNewsLetterSubscribeEmail function is responsible to trigger email for newsletter subscription
 * @param  {Object} userObj contains user email and encrypted Id
 */
function sendNewsLetterSubscribeEmail(userObj) {
    var URLUtils = require('dw/web/URLUtils');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    userObj = {
        email: userObj.email,
        id : userObj.encryptedNewsletterId
    };

    var emailObj = {
        to: userObj.email,
        subject: Resource.msg('email.subject.newsletter', 'newsletter', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: 1
    };

    // send email
    emailHelpers.sendEmail(emailObj, 'mail/newsletterSubscribe', userObj);
}


module.exports = {
    sendNewsLetterSubscribeEmail: sendNewsLetterSubscribeEmail
};
