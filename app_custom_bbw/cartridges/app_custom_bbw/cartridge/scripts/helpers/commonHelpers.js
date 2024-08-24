/* eslint-disable no-mixed-spaces-and-tabs */

'use strict';

var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
var emailContentHelpers = require('*/cartridge/scripts/helpers/emailContentHelpers');
var ContentMgr = require('dw/content/ContentMgr');
var URLUtils = require('dw/web/URLUtils');

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

/**
 * function : This point will get breadcrumb for a content asset folder
 * @param {object} folder content folder
 * @param {boolean} isBlogs to check content is blog
 * @returns {object} - returns an element of the array that is breadcrumbs.
 */
function getBreadcrumbForContentAssetFolders(folder, isBlogs) {
    if (folder.ID !== 'faq') {
        // displayName.
        if (folder.parent !== null) {
            var breadcrumbs = getBreadcrumbForContentAssetFolders(
                folder.parent,
                isBlogs
            );
            if (breadcrumbs) {
                if(isBlogs) {
                    if (folder.ID === 'Blogs') {
                        breadcrumbs.push({
                            htmlValue: folder.displayName,
                            url: URLUtils.https('Blogs-Show').toString()
                        });
                    } else {
                        breadcrumbs.push({
                            htmlValue: folder.displayName,
                            url:URLUtils.https('Blogs-Show').toString() + '#' + folder.displayName.replace(' ', '')
                        });
                    }
                } else {
                    breadcrumbs.push({
                        htmlValue: folder.displayName,
                        url: URLUtils.https('Page-Show', 'cid', folder.ID).toString()
                    });
                }
                return breadcrumbs;
            }
        } else {
            return [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                }
            ];
        }
    }
    return '';
}

/**
 * function : This will return boolean to check content blogs. 
 * @param {object} content content assests
 * @returns {boolean} - returns an element of the array that is breadcrumbs.
 */
function isContentBlock(content) {
    return content.folders && content.folders.length > 0 && content.folders[0].parent.ID === 'Blogs';
}

/**
 * function : This point will get breadcrumb for a content asset 
 * @param {object} content content assests
 * @returns {object} - returns an element of the array that is breadcrumbs.
 */
function getBreadcrumbForContentAsset(content) {
    var breadcrumbs = [];
    var isBlogs = isContentBlock(content);
    if (content.folders && content.folders.length > 0) {
        breadcrumbs = getBreadcrumbForContentAssetFolders(
            content.folders[0],
            isBlogs
        );
    } else {
        breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            }
        ];
    }
    if (breadcrumbs) {
        breadcrumbs.push({
            htmlValue: content.name,
            url: URLUtils.https('Page-Show', 'cid', content.ID).toString()
        });
        return breadcrumbs;
    }
    return '';
}

/**
 * Check product availability
 * @param {string} productId product id
 * @returns {JSON} response with product available and isSearchableIfUnavailable
 */
function checkProductAvailability(productId) {
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var product = ProductFactory.get({ pid: productId });
    var response = {
        isAvailable: product.available,
        isSearchableIfUnavailable: product.isSearchableIfUnavailable
    };
    return response;
}

/**
 * getTrackingUrl Returns Tracking Url using according ro carrier name
 * @param {string} carrier - Career Name of the tracking service
 * @param {string }trackingNumber - Tracking Number of the order
 * @returns {string} - returns a tracking URL or false
 */
function getTrackingUrl(carrier, trackingNumber){
    if(!carrier || !trackingNumber){
        return false;
    }
    var allTrackingUrls = Site.current.getCustomPreferenceValue('allTrackingUrls');
    allTrackingUrls = JSON.parse(allTrackingUrls);
    var trackingUrl = '';
    trackingUrl = allTrackingUrls[carrier] + trackingNumber;
    return trackingUrl;
}

/**
 * Used to check is express checkout order
 * @param {dw.order.Order} order - The current user's order
 * @returns {boolean} true/false
 */
function checkExpressCheckout(order) {
    var expressCheckout = false;
    var paymentInstrument = order.paymentInstruments[0];
    if (paymentInstrument.paymentMethod === 'AdyenComponent' && !order.billingAddress.custom.dialCode) {
        expressCheckout = true;
    } else if (paymentInstrument.paymentMethod === 'AFTERPAY') {
        expressCheckout = paymentInstrument.paymentTransaction.custom.apExpressCheckout;
    }
    return expressCheckout;
}

module.exports = {
    sendNewsLetterSubscribeEmail: sendNewsLetterSubscribeEmail,
    zeroOrderEmail: zeroOrderEmail,
    sendChangePasswordEmail: sendChangePasswordEmail,
    getAvailability: getAvailability,
    getBreadcrumbForContentAsset: getBreadcrumbForContentAsset,
    checkProductAvailability: checkProductAvailability,
    getTrackingUrl: getTrackingUrl,
    checkExpressCheckout: checkExpressCheckout
};
