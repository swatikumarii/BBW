/* eslint-disable no-mixed-spaces-and-tabs */

'use strict';

var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
var emailContentHelpers = require('*/cartridge/scripts/helpers/emailContentHelpers');
var ContentMgr = require('dw/content/ContentMgr');

/**
 * sendNewsLetterSubscribeEmail function is responsible to trigger email for newsletter subscription
 * @param  {object} userObj contains user email and encrypted Id
 */
function sendNewsLetterSubscribeEmail(userObj) {
    var emailContent = ContentMgr.getContent('email-newsletter'); // News letter Email Content Asset Id
    var emailMarkup = '';

    if (!empty(emailContent) && emailContent.online) {
        emailMarkup = emailContent.custom.body.markup;
    }

    var userData = {
        email: userObj.email,
        id : userObj.encryptedNewsletterId,
        markup: emailMarkup,
        content: emailContentHelpers.getEmailContent('footer-only-topoffer','newsletter-header')
    };

    var emailObj = {
        to: userObj.email,
        subject: Resource.msg('email.subject.newsletter', 'newsletter', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: 1
    };

    // send email
    emailHelpers.sendEmail(emailObj, 'mail/newsletterSubscribe', userData);
}

/**
 * zeroOrderEmail is used to send email notification when 0 amount order placed
 * @param {dw.order.Order} order - the order object
 */
function zeroOrderEmail(order) {
    var zeroOrderEmailAddress = Site.current.getCustomPreferenceValue('zeroOrderEmail');
    if (zeroOrderEmailAddress) {
        var orderData = {
            orderNo: order.orderNumber
        };
        var emailObj = {
            to: zeroOrderEmailAddress,
            subject: Resource.msg('zero.order.email.subject', 'order', null),
            from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
            type: 1
        };

        // send email
        emailHelpers.sendEmail(emailObj, 'order/zeroOrderEmail', orderData);
    }
}

/**
 * sendRestPasswordEmail function is responsible to trigger email for change password subscription
 * @param  {object} email contains user email
 */
function sendChangePasswordEmail(email) {
    var emailObj = {
        to: email,
        subject: Resource.msg('email.subject.account.change.password', 'common', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: 1
    };

    emailHelpers.sendEmail(emailObj, 'mail/changePasswordEmail', email);
}

/**
 * Get the status of contacting
 * @returns {Array} responseArray activeClassName and activeMessage
 */
function getAvailability() {
    var opening = Site.current.getCustomPreferenceValue('openingTime');
    var closing = Site.current.getCustomPreferenceValue('closingTime');

    var activeClassName;
    var activeMessage;
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var currentTime = hours + '.' + (minutes < 10 ? '0' : '') + minutes;

    if (currentTime >= opening && currentTime < closing) {
        activeClassName = Resource.msg('active.status.class', 'common', null);
        activeMessage = Resource.msg('active.status.message', 'common', null);
    } else {
        activeClassName = Resource.msg('offline.status.class', 'common', null);
        activeMessage = Resource.msg('offline.status.message', 'common', null);
    }
    var responseArray = [activeClassName, activeMessage];
    return responseArray;
}

module.exports = {
    sendNewsLetterSubscribeEmail: sendNewsLetterSubscribeEmail,
    zeroOrderEmail: zeroOrderEmail,
    sendChangePasswordEmail: sendChangePasswordEmail,
    getAvailability: getAvailability
};
