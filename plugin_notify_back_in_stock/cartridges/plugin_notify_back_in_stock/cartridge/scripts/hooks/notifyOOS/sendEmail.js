'use strict';

var Resource = require('dw/web/Resource');
var Mail = require('dw/net/Mail');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var Site = require('dw/system/Site');
var emailContentHelpers = require('*/cartridge/scripts/helpers/emailContentHelpers');
var ContentMgr = require('dw/content/ContentMgr');

// Function used to Send Mail
exports.sendMail = function (data) {
    var userEmail = data.email;
    var product = data.product;
    var numberOfProducts = product.length;
    var fromMail = Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com';

    var notifyEmailMarkup = '';
    var notifyEmailContent = ContentMgr.getContent('email-notifyme-content'); // Notify Email Content Asset Id
    if (!empty(notifyEmailContent) && notifyEmailContent.online) {
        notifyEmailMarkup = notifyEmailContent.custom.body.markup;
    }

    // Send email to user
    var email = new Mail();
    var template = new Template('mail/backInStock');
    var contentHashMap = new HashMap();
    var subject = Resource.msg('email.subject.backinstock', 'notifyMe', null);
    contentHashMap.put('product', product);
    contentHashMap.put('numberOfProducts', numberOfProducts);
    contentHashMap.put('markup', notifyEmailMarkup);
    contentHashMap.put('content', emailContentHelpers.getEmailContent('footer-only-topoffer', 'email-header'));
    var content = template.render(contentHashMap).text;
    email.setFrom(fromMail);
    email.setSubject(subject);
    email.setContent(content, 'text/html', 'UTF-8');
    email.addTo(userEmail);
    email.send();
};
