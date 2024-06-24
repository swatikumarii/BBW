'use strict';

var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');

var afterpayUpdateOrderService = module.superModule;

afterpayUpdateOrderService.sendConfirmationEmail = function (order, containerView) {
    var OrderModel = require('*/cartridge/models/order');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var emailContentHelpers = require('*/cartridge/scripts/helpers/emailContentHelpers');
    var ContentMgr = require('dw/content/ContentMgr');
    var brandUtilities = require('*/cartridge/scripts/util/afterpayUtilities').brandUtilities;

    var emailMarkup = '';
    var emailContent = ContentMgr.getContent('email-order-confirmation'); // Order Confirmation Email Content Asset Id

    if (!empty(emailContent) && emailContent.online) {
        emailMarkup = emailContent.custom.body.markup;
    }

    var orderModel = new OrderModel(order, {
        containerView: containerView || 'basket',
        countryCode: brandUtilities.getCountryCode()
    });

    var orderObject = {
        order: orderModel,
        markup: emailMarkup,
        content: emailContentHelpers.getEmailContent('normal-footer', 'email-header')
    };

    var emailObj = {
        to: order.customerEmail,
        subject: Resource.msgf('subject.order.confirmation.email', 'order', null, orderModel.orderNumber),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
        type: emailHelpers.emailTypes.orderConfirmation
    };

    emailHelpers.sendEmail(emailObj, 'checkout/confirmation/confirmationEmail', orderObject);
};

module.exports = afterpayUpdateOrderService;
