/* eslint-disable quote-props */
/* eslint-disable no-undef */

'use strict';

var ISML = require('dw/template/ISML');
var HashMap = require('dw/util/HashMap');
var Template = require('dw/util/Template');
var getOrders = require('*/cartridge/scripts/getOrders');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Mail = require('dw/net/Mail');
var Site = require('dw/system/Site');
var giftcardHelper = require('*/cartridge/scripts/giftcardHelper');
var sendgridApi = require('*/cartridge/scripts/service/sendgridApi');
var sendgridPref = require('*/cartridge/scripts/service/sendgridPreference');

/**
 * forEach method for dw.util.Collection subclass instances
 * @param {dw.util.Collection} collection - Collection subclass instance to map over
 * @param {Function} callback - Callback function for each item
 * @param {Object} [scope] - Optional execution scope to pass to callback
 * @returns {void}
 */
function forEach(collection, callback, scope) {
  var iterator = collection.iterator();
  var index = 0;
  var item = null;
  while (iterator.hasNext()) {
    item = iterator.next();
    if (scope) {
      callback.call(scope, item, index, collection);
    } else {
      callback(item, index, collection);
    }
    index += 1;
  }
}

/**
 * gets the render html for the given isml template
 * @param {Object} templateContext - object that will fill template placeholders
 * @param {string} templateName - the name of the isml template to render.
 * @returns {string} the rendered isml.
 */
function getRenderedHtml(templateContext, templateName) {
  var context = new HashMap();
  var template;

  Object.keys(templateContext).forEach(function (key) {
    context.put(key, templateContext[key]);
  });
  template = new Template(templateName);
  return template.render(context).text;
}

function OrderList() {
  var pageSize = request.httpParameterMap.pagesize.value;
  var pageNumber = request.httpParameterMap.pagenumber.value;
  var orderNumber = request.httpParameterMap.ordernumber.value || '';
  var orderListResponse;

  pageSize = pageSize ? parseInt(pageSize, 10) : 10;
  pageNumber = pageNumber ? parseInt(pageNumber, 10) : 1;

  orderListResponse = getOrders.output({
    pageSize: pageSize,
    pageNumber: pageNumber,
    orderNumber: orderNumber
  });

  ISML.renderTemplate('order/orderlist', orderListResponse);
}

function OrderDetails() {
  var CurrentHttpParameterMap = request.httpParameterMap;
  ISML.renderTemplate('order/orderDetails', CurrentHttpParameterMap);
}

function ResendEmail() {
  var CurrentHttpParameterMap = request.httpParameterMap;
  var orderID = CurrentHttpParameterMap.OrderNo.stringValue;
  var lineItemID = CurrentHttpParameterMap.uuid.stringValue;
  var order = OrderMgr.searchOrder('orderNo = {0}', orderID);
  var giftLineItem;
  var receipientMail;
  var context;
  var emailRequest;
  var recipientGiftEmail;
  forEach(order.allLineItems, function (currentLineItem) {
    if (currentLineItem.UUID === lineItemID) {
      giftLineItem = currentLineItem;
    }
  });
  if ('custom' in giftLineItem && giftLineItem.custom.eGiftCardNumber
    && giftLineItem.custom.eGiftCardNumber !== null
    && giftLineItem.custom.eGiftCardNumber !== undefined
    && giftLineItem.custom.eGiftCardNumber !== 'null' && giftLineItem.custom.eGiftCardNumber !== 'undefined') {
    context = giftcardHelper.getContext(giftLineItem);
  } else {
    context = giftcardHelper.getNewContext(order, giftLineItem);
  }

  if (sendgridPref.isSendgridEnable) {
    emailRequest = {
      personalizations: [
        {
          to: [
            {
              email: giftLineItem.custom.eGiftReceiverEmail
            }
          ]
        }
      ],
      from: {
        email: sendgridPref.sendgridFromEmail
      },
      subject: (Resource.msg('subject.order.egift.detail.email', 'giftcards', null)),
      content: [
        {
          type: 'text/html',
          value: getRenderedHtml(context, 'confirmation/confirmationEgiftEmailToRecipient')
        }
      ],
      tracking_settings: {
        'click_tracking': {
          'enable': true,
          'enable_text': false
        }
      }
    };
    receipientMail = sendgridApi.sendEmail(emailRequest);
  } else {
    recipientGiftEmail = new Mail();
    recipientGiftEmail.addTo(giftLineItem.custom.eGiftReceiverEmail);
    recipientGiftEmail.setSubject(Resource.msg('subject.order.confirmation.email', 'common', null));
    recipientGiftEmail.setFrom(Site.current.getCustomPreferenceValue('customerServiceEmail')
     || 'no-reply@testorganization.com');
    recipientGiftEmail.setContent(
      getRenderedHtml(context, 'confirmation/confirmationEgiftEmailToRecipient'),
      'text/html',
      'UTF-8'
    );
    receipientMail = recipientGiftEmail.send();
  }
  if ((('code' in receipientMail && receipientMail.code === 'OK') || ('response' in receipientMail && receipientMail.response.status === 'OK')) && !receipientMail.error) {
    CurrentHttpParameterMap = {
      OrderNo: orderID, success: true, giftcardNumber: context.giftcardNumber
    };
    ISML.renderTemplate('order/orderDetails', CurrentHttpParameterMap);
  } else {
    ISML.renderTemplate('giftcard/resendError');
  }
}

OrderList.public = true;
OrderDetails.public = true;
ResendEmail.public = true;

exports.OrderList = OrderList;
exports.OrderDetails = OrderDetails;
exports.ResendEmail = ResendEmail;
