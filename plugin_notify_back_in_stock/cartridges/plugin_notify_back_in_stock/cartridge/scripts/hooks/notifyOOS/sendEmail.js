'use strict';

var Resource = require('dw/web/Resource');
var Mail = require('dw/net/Mail');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var Site = require('dw/system/Site');

// Function used to Send Mail
exports.sendMail = function (data) {
    var userEmail = data.email;
    var product = data.product;
    var numberOfProducts = product.length;
    // var bgImage = data.bgImage;
    var fromMail = Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com';
    // Send email to user
    var email = new Mail();
    var template = new Template('mail/backInStock');
    var contentHashMap = new HashMap();
    var subject = Resource.msg('email.subject', 'backInStock', null);
    contentHashMap.put('product', product);
    contentHashMap.put('numberOfProducts', numberOfProducts);
    // contentHashMap.put('bgImage', bgImage);
    var content = template.render(contentHashMap).text;
    email.setFrom(fromMail);
    email.setSubject(subject);
    email.setContent(content, 'text/html', 'UTF-8');
    email.addTo(userEmail);
    email.send();
};
