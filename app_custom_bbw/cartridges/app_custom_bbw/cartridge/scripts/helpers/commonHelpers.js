/* eslint-disable no-mixed-spaces-and-tabs */

'use strict';

var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');

/**
 * sendNewsLetterSubscribeEmail function is responsible to trigger email for newsletter subscription
 * @param  {object} userObj contains user email and encrypted Id
 */
function sendNewsLetterSubscribeEmail(userObj) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var userData = {
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
    emailHelpers.sendEmail(emailObj, 'mail/newsletterSubscribe', userData);
}

/**
 * zeroOrderEmail is used to send email notification when 0 amount order placed
 * @param {dw.order.Order} order - the order object
 */
function zeroOrderEmail(order) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var zeroOrderEmailConfig = JSON.parse(Site.current.getCustomPreferenceValue('zeroOrderEmail'));
    if (zeroOrderEmailConfig && zeroOrderEmailConfig.enable === true && zeroOrderEmailConfig.emailAddress) {
        var orderData = {
            orderNo: order.orderNumber
        }
        var emailObj = {
            to: zeroOrderEmailConfig.emailAddress,
            subject: Resource.msg('zero.order.email.subject', 'order', null),
            from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
            type: 1
        };

        // send email
        emailHelpers.sendEmail(emailObj, 'order/zeroOrderEmail', orderData);
    }
}


module.exports = {
    sendNewsLetterSubscribeEmail: sendNewsLetterSubscribeEmail,
    zeroOrderEmail: zeroOrderEmail
};
