'use strict';

var Locale = require("dw/util/Locale");

/**
 * get Email Content
 * @returns {object} - object with content to be putted in email
 * @param {string} footerType - Footer type
 * @param {string} headerType - Footer type
 */
function getEmailContent(footerType, headerType) {
    var ContentMgr = require('dw/content/ContentMgr');

    var headerContent = null;
    var footerContent = null;
    var content = null;

    if(headerType === 'newsletter-header') {
        content = ContentMgr.getContent('email-header-newsletter');
    } else {
        content = ContentMgr.getContent('email-header');
    }

    if (content && content.isOnline()) {
        headerContent = content.getCustom().body.markup;
    }

    if (footerType === 'normal-footer') {
        content = ContentMgr.getContent('email-footer');
    } else if (footerType === 'footer-suggestions') {
        content = ContentMgr.getContent('email-footer-with-suggestions');
    } else if (footerType === 'footer-only-topoffer') {
        content = ContentMgr.getContent('email-footer-only-topoffer');
    } else {
        content = false;
    }

    if (content && content.isOnline()) {
        footerContent = content.getCustom().body.markup;
    }

    return {
        headerContent: headerContent,
        footerContent: footerContent
    };
}

function getInvoice(orderNo, hostName) {
    var URLUtils = require("dw/web/URLUtils");
    var OrderMgr = require('dw/order/OrderMgr');
    var ContentMgr = require("dw/content/ContentMgr");
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
        var content = getEmailContent("normal-footer", "email-header");
        var image = ContentMgr.getContent("email-progress-status-image").getCustom().body
          .markup;
        return {
          order: orderModelData,
          content: content,
          taxRate: taxRate,
          progressImage: URLUtils.httpsImage(
            require("dw/system/Site").getCurrent().httpsHostName,
            "/images/email/orders/status/icon-placed.png",
            {}
          ),
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
    var content = getEmailContent("normal-footer", "email-header");
    return {
      order: orderModelData,
      taxRate: taxRate,
      invoiceUrl: URLUtils.https(
        "Order-InvoiceDownload",
        "token",
        encodedOrderNumber
      ).toString(),
      content: content,
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

function getShippedData(orderNo) {
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
    var shippedEmailMarkup = "";
    var shippedEmailFooterMarkup = "";
    var shippedemailContent = ContentMgr.getContent(
      "email-good-to-konw-shipped-block"
    );
    if (!empty(shippedemailContent) && shippedemailContent.online) {
      shippedEmailMarkup = shippedemailContent.custom.body.markup;
    }

    return {
      order: orderModelData,
      content: getEmailContent('normal-footer', 'email-header'),
      taxRate: taxRate,
      markup: shippedEmailMarkup,
      shippedImage: ContentMgr.getContent("email-shipped-image").getCustom().body.markup
    };
  }
  return {};
}


getInvoice.public = true;
getCanceledData.public = true;
getShippedData.public = true;

exports.getCanceledData = getCanceledData;
exports.getInvoice = getInvoice;
exports.getShippedData = getShippedData;

// module.exports = getInvoice;

