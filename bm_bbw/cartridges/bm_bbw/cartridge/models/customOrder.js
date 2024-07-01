'use strict';

// var OrderMgr = require("dw/order/OrderMgr");
var Locale = require("dw/util/Locale");

/**
 * @namespace Order
 */

function getInvoice(orderNo) {
    var OrderMgr = require('dw/order/OrderMgr');
    // var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
    var orderModel = require("*/cartridge/models/order");
    var TaxMgr = require('dw/order/TaxMgr');

    var order = OrderMgr.getOrder(orderNo);
    var taxClassId = TaxMgr.getDefaultTaxClassID();
    var taxJurisdictionId = TaxMgr.getDefaultTaxJurisdictionID();
    var getTaxRate = TaxMgr.getTaxRate(taxClassId, taxJurisdictionId);
    var taxRate = getTaxRate * 100;

    if (order) {
        // var orderModel = orderHelpers.getOrderDetailsByID(
        //   req.querystring.orderNo,
        //   req.locale.id
        // );

        var config = {
            numberOfLineItems: "*",
        };

        // var currentLocale = Locale.getLocale(locale);

        var orderModelData = orderModel.OrderModel(order, {
          config: config,
          // ,
          // countryCode: currentLocale.country,
        });
        return {
          order: orderModelData,
          taxRate: taxRate,
        };
    }
    return {};
}

function getCanceledData(orderNo) {
  var OrderMgr = require("dw/order/OrderMgr");
  var ContentMgr = require("dw/content/ContentMgr");
  var URLUtils = require("dw/web/URLUtils");
  var encryptionHelper = require("*/cartridge/scripts/helpers/encryptionHelpers");
  // var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
  var orderModel = require("*/cartridge/models/order");
  var TaxMgr = require("dw/order/TaxMgr");

  var order = OrderMgr.getOrder(orderNo);
  var taxClassId = TaxMgr.getDefaultTaxClassID();
  var taxJurisdictionId = TaxMgr.getDefaultTaxJurisdictionID();
  var getTaxRate = TaxMgr.getTaxRate(taxClassId, taxJurisdictionId);
  var taxRate = getTaxRate * 100;

  if (order) {
    var config = {
      numberOfLineItems: "*",
    };

    var orderModelData = orderModel.OrderModel(order, {
      config: config,
    });
    var cancelEmailMarkup = "";
    var cancelEmailFooterMarkup = "";
    var emailContent = ContentMgr.getContent("email-good-to-konw-block"); // Canceled Order Email Content Asset Id
    var emailFooterContent = ContentMgr.getContent(
      "email-order-confirmation"
    ); // Canceled Order Email Footer Image Content Asset Id

    if (!empty(emailContent) && emailContent.online) {
      cancelEmailMarkup = emailContent.custom.body.markup;
    }

    if (!empty(emailFooterContent) && emailFooterContent.online) {
      cancelEmailFooterMarkup = emailFooterContent.custom.body.markup;
    }
    var encodedOrderNumber = encodeURIComponent(
      encryptionHelper.encryptPin(orderModelData.orderNumber)
    );
    return {
      order: orderModelData,
      taxRate: taxRate,
      invoiceUrl: URLUtils.https(
        "Order-InvoiceDownload",
        "token",
        encodedOrderNumber
      ).toString(),
      // content: emailContentHelpers.getEmailContent(
      //   "normal-footer",
      //   "email-header"
      // ),
      markup: cancelEmailMarkup,
      footermarkup: cancelEmailFooterMarkup,
    };
  }
  return {};
}


getInvoice.public = true;
getCanceledData.public = true;

exports.getCanceledData = getCanceledData;
exports.getInvoice = getInvoice;

// module.exports = getInvoice;

