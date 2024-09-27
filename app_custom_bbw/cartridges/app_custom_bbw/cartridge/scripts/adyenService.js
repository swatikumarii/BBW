"use strict";

var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var HashMap = require('dw/util/HashMap');
var Mail = require('dw/net/Mail');
var Template = require('dw/util/Template');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var OrderModel = require('*/cartridge/models/order');
var Logger = require('dw/system/Logger');
var loggerOrderConfirmation = Logger.getLogger('OrderAdyenService');

function sendEmail(order) {
  var confirmationEmail = new Mail();
  var context = new HashMap();
  var orderModel = new OrderModel(order, {
    containerView: 'order'
  });
  var orderObject = {
    order: orderModel
  };
  loggerOrderConfirmation.info(
      'Order Confirmation mail trigger for this ' + order.customerEmail
  );
  confirmationEmail.addTo(order.customerEmail);
  confirmationEmail.setSubject(Resource.msgf('subject.order.confirmation.email', 'order', null, order.orderNo));
  confirmationEmail.setFrom(Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com');
  Object.keys(orderObject).forEach(function (key) {
    context.put(key, orderObject[key]);
  });
  var template = new Template('checkout/confirmation/confirmationEmail');
  var content = template.render(context).text;
  confirmationEmail.setContent(content, 'text/html', 'UTF-8');
  
  try {
      var mailSent = confirmationEmail.send();
  } catch (e) {
      loggerOrderConfirmation.error(
          'Error in Sending Order Confirmation mail ' + e.message
      );
  }

  loggerOrderConfirmation.info(
      'Order Confirmation mail successfully sended for this ' +
          order.customerEmail
  );
}
function submit(order) {
  try {
    Transaction.begin();
    // Places the order if not placed yet
    if (order.status.value === Order.ORDER_STATUS_CREATED) {
      // custom fraudDetection
      var fraudDetectionStatus = {
        status: 'success'
      };
      var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
      if (placeOrderResult.error) {
        return placeOrderResult;
      }
    }
    sendEmail(order);
    Transaction.commit();
    return {
      order_created: true
    };
  } catch (e) {
    Transaction.rollback();
    return {
      error: true
    };
  }
}
module.exports = {
  submit: submit
};
