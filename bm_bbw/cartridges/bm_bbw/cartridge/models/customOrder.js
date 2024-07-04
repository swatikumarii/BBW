'use strict';

var Logger = require("dw/system/Logger");
var Locale = require("dw/util/Locale");

var contentApi = require("*/cartridge/scripts/service/contentApi");

/**
 * get Email Content
 * @returns {object} - object with content to be putted in email
 * @param {string} footerType - Footer type
 * @param {string} headerType - Footer type
 */
function getEmailContent(footerType, headerType) {
    // var ContentMgr = require('dw/content/ContentMgr');

    var headerContent = null;
    var footerContent = null;
    var content = null;

    if(headerType === 'newsletter-header') {
        content = contentApi.contentApi(
          "email-header-newsletter"
        );
    } else {
        content = contentApi.contentApi("email-header");
        Logger.info("get content email-header : " + content);
    }

    if (content) {
        headerContent = content;
    }
    Logger.info("get content email-header  headerContent : " + headerContent);

    if (footerType === 'normal-footer') {
        content = contentApi.contentApi('email-footer');
    } else if (footerType === 'footer-suggestions') {
        content = contentApi.contentApi('email-footer-with-suggestions');
    } else if (footerType === 'footer-only-topoffer') {
        content = contentApi.contentApi('email-footer-only-topoffer');
    } else {
        content = false;
    }
    Logger.info("get content email-header footerType : " + content);

    if (content) {
        footerContent = content;
    }

    return {
        headerContent: headerContent,
        footerContent: footerContent
    };
}

function getInvoice(orderNo, hostName) {
    var URLUtils = require("dw/web/URLUtils");
    var OrderMgr = require('dw/order/OrderMgr');
    // var ContentMgr = require("dw/content/ContentMgr");
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

        Logger.info("get content ");
        var content = getEmailContent("normal-footer", "email-header");
        Logger.info("get content content : " + content);
        return {
          order: orderModelData,
          content: content,
          taxRate: taxRate,
          progressImage: URLUtils.httpsImage(
            require("dw/system/Site").getCurrent().httpsHostName,
            "/images/email/orders/status/icon-placed.png",
            {}
          ),
          markup: contentApi.contentApi('email-order-confirmation'),
        };
    }
    return {};
}

function getCanceledData(orderNo) {
  var OrderMgr = require("dw/order/OrderMgr");
  // var ContentMgr = require("dw/content/ContentMgr");
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
    var emailContent = contentApi.contentApi("email-good-to-konw-block"); // Canceled Order Email Content Asset Id
    var emailFooterContent = contentApi.contentApi(
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
  // var ContentMgr = require("dw/content/ContentMgr");
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
    var shippedemailContent = contentApi.contentApi(
      "email-good-to-konw-shipped-block"
    );
    if (!empty(shippedemailContent) && shippedemailContent.online) {
      shippedEmailMarkup = shippedemailContent.custom.body.markup;
    }

    var content = getEmailContent("normal-footer", "email-header");
    return {
      order: orderModelData,
      content: content,
      taxRate: taxRate,
      markup: shippedEmailMarkup,
      shippedImage: URLUtils.httpsImage(
        require("dw/system/Site").getCurrent().httpsHostName,
        "/images/email/orders/status/icon-shipped.png",
        {}
      ),
      shippedIcon: URLUtils.httpsImage(
        require("dw/system/Site").getCurrent().httpsHostName,
        "/images/email/orders/status/shipped-icon.png",
        {}
      ),
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

