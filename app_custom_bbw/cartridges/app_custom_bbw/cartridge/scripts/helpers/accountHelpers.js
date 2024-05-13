'use strict';

var base = module.superModule;

var URLUtils = require('dw/web/URLUtils');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
var emailContentHelpers = require('*/cartridge/scripts/helpers/emailContentHelpers');
var ContentMgr = require('dw/content/ContentMgr');

// var endpoints = require('*/cartridge/config/oAuthRenentryRedirectEndpoints');

/**
 * Validates that the input string is a valid date formatted as "mm/dd/yyyy"
 * @param {string} dateString - input date string
 * @returns {boolean} - value which indicate that entered DOB is valid or not
 */
function isValidDate(dateString) {

    var day = parseInt(dateString[2], 10);
    var month = parseInt(dateString[1], 10);
    var year = parseInt(dateString[0], 10);

    if (year < 1000 || year > 3000 || month === 0 || month > 12) {
        return false;
    }

    var monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
        monthLength[1] = 29;
    }

    return day > 0 && day <= monthLength[month - 1];
}

/**
 * Gets the password reset token of a customer
 * @param {object} customer - the customer requesting password reset token
 * @returns {string} password reset token string
 */
function getPasswordResetToken(customer) {
    var Transaction = require('dw/system/Transaction');

    var passwordResetToken;
    Transaction.wrap(function () {
        passwordResetToken = customer.profile.credentials.createResetPasswordToken();
    });
    return passwordResetToken;
}

/**
 * Sends the email with password reset instructions
 * @param {string} email - email for password reset
 * @param {object} resettingCustomer - the customer requesting password reset
 */
function sendPasswordResetEmail(email, resettingCustomer) {
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var emailContent = ContentMgr.getContent('password-reset-notification-mail'); // Forgot Password Content Asset Id
    var emailMarkup = '';
    var passwordResetToken = getPasswordResetToken(resettingCustomer);
    var url = URLUtils.https('Account-SetNewPassword', 'Token', passwordResetToken);

    if (!empty(emailContent) && emailContent.online) {
        emailMarkup = emailContent.custom.body.markup;
        emailMarkup = emailMarkup.replace('{{customerName}}', resettingCustomer.profile.firstName);
        emailMarkup = emailMarkup.replace('{{resetPasswordLink}}', url);
        emailMarkup = emailMarkup.replace('{{resetPasswordText}}', url.toString());
    }

    var objectForEmail = {
        passwordResetToken: passwordResetToken,
        markup: emailMarkup,
        preHeader: Resource.msg('text.preheader.account.password.reset', 'email', null),
        content: emailContentHelpers.getEmailContent('normal-footer')
    };

    var emailObj = {
        to: email,
        subject: Resource.msg('subject.profile.resetpassword.email', 'login', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.passwordChanged
    };

    emailHelpers.sendEmail(emailObj, 'mail/account/password/passwordResetEmail', objectForEmail);
}

/**
 * Send an email that would notify the user that account was created
 * @param {object} registeredUser - object that contains user's email address and name information.
 */
function sendCreateAccountEmail(registeredUser) {
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var emailMarkup = '';
    var emailContent = ContentMgr.getContent('email-welcome'); // Welcome Email Content Asset Id

    if (!empty(emailContent) && emailContent.online) {
        emailMarkup = emailContent.custom.body.markup;
    }

    var userObject = {
        email: registeredUser.email,
        firstName: registeredUser.firstName,
        lastName: registeredUser.lastName,
        url: URLUtils.https('Login-Show'),
        markup: emailMarkup,
        content: emailContentHelpers.getEmailContent('footer-suggestions')
    };

    var emailObj = {
        to: registeredUser.email,
        subject: Resource.msg('email.subject.new.registration', 'registration', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.registration
    };

    emailHelpers.sendEmail(emailObj, 'mail/account/accountRegisteredEmail', userObject);
}

/**
 * Send an email that would notify the user that account was edited
 * @param {object} profile - object that contains user's profile information.
 */
function sendAccountEditedEmail(profile) {
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');

    var emailContent = ContentMgr.getContent('email-account-edited'); // Forgot Password Content Asset Id
    var emailMarkup = '';

    if (!empty(emailContent) && emailContent.online) {
        emailMarkup = emailContent.custom.body.markup;
        emailMarkup = emailMarkup.replace('{{customerName}}', profile.firstName);
    }

    var userObject = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        url: URLUtils.https('Login-Show'),
        markup: emailMarkup,
        content: emailContentHelpers.getEmailContent('normal-footer','email-header')
    };

    var emailObj = {
        to: profile.email,
        subject: Resource.msg('email.subject.account.edited', 'account', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.accountEdited
    };

    emailHelpers.sendEmail(emailObj, 'mail/account/accountEditedEmail', userObject);
}

/**
 * Send an email that would notify the user that address was added
 * @param {object} profile - object that contains user's profile information.
 */
function sendAddAddressEmail(profile) {
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');

    var emailContent = ContentMgr.getContent('email-add-address'); // Forgot Password Content Asset Id
    var emailMarkup = '';
    var url = URLUtils.https('Login-Show');

    if (!empty(emailContent) && emailContent.online) {
        emailMarkup = emailContent.custom.body.markup;
        emailMarkup = emailMarkup.replace('{{customerName}}', profile.firstName);
        emailMarkup = emailMarkup.replace('{{myAccountLink}}', url);
    }

    var userObject = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        url: url,
        markup: emailMarkup,
        content: emailContentHelpers.getEmailContent('normal-footer','email-header')
    };

    var emailObj = {
        to: profile.email,
        subject: Resource.msg('email.subject.account.edited', 'account', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.accountEdited
    };

    emailHelpers.sendEmail(emailObj, 'mail/account/address/addAddressEmail', userObject);
}

/**
 * Send an email that would notify the user that address was edited
 * @param {object} profile - object that contains user's profile information.
 */
function sendEditAddressEmail(profile) {
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');

    var emailContent = ContentMgr.getContent('email-edit-address'); // Forgot Password Content Asset Id
    var emailMarkup = '';
    var url = URLUtils.https('Login-Show');

    if (!empty(emailContent) && emailContent.online) {
        emailMarkup = emailContent.custom.body.markup;
        emailMarkup = emailMarkup.replace('{{customerName}}', profile.firstName);
        emailMarkup = emailMarkup.replace('{{myAccountLink}}', url);
    }

    var userObject = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        url: url,
        markup: emailMarkup,
        content: emailContentHelpers.getEmailContent('normal-footer','email-header')
    };

    var emailObj = {
        to: profile.email,
        subject: Resource.msg('email.subject.account.edited', 'account', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.accountEdited
    };

    emailHelpers.sendEmail(emailObj, 'mail/account/address/editAddressEmail', userObject);
}

/**
 * Send an email that would notify the user that address was deleted
 * @param {object} profile - object that contains user's profile information.
 */
function sendDeleteAddressEmail(profile) {
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');

    var emailContent = ContentMgr.getContent('email-delete-address'); // Forgot Password Content Asset Id
    var emailMarkup = '';
    var url = URLUtils.https('Login-Show');

    if (!empty(emailContent) && emailContent.online) {
        emailMarkup = emailContent.custom.body.markup;
        emailMarkup = emailMarkup.replace('{{customerName}}', profile.firstName);
        emailMarkup = emailMarkup.replace('{{myAccountLink}}', url);
    }

    var userObject = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        url: url,
        markup: emailMarkup,
        content: emailContentHelpers.getEmailContent('normal-footer','email-header')
    };

    var emailObj = {
        to: profile.email,
        subject: Resource.msg('email.subject.account.edited', 'account', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.accountEdited
    };

    emailHelpers.sendEmail(emailObj, 'mail/account/address/deleteAddressEmail', userObject);
}


module.exports = {
    isValidDate: isValidDate,
    sendPasswordResetEmail: sendPasswordResetEmail,
    sendCreateAccountEmail: sendCreateAccountEmail,
    sendAccountEditedEmail: sendAccountEditedEmail,
    sendAddAddressEmail: sendAddAddressEmail,
    sendEditAddressEmail: sendEditAddressEmail,
    sendDeleteAddressEmail: sendDeleteAddressEmail
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
