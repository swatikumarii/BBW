'use strict';

var Logger = require("dw/system/Logger");
var Site = require("dw/system/Site");
var URLUtils = require("dw/web/URLUtils");
var URLAction = require("dw/web/URLAction");
var URLParameter = require("dw/web/URLParameter");
var contentApi = require("*/cartridge/scripts/service/contentApi");
var encryptionHelper = require("*/cartridge/scripts/helpers/encryptionHelpers");

function getInvoice(orderNo) {
  Logger.info('Get Invoice triggered for orderNo : ' + orderNo);
  var encodedOrderNumber = encodeURIComponent(
    encryptionHelper.encryptPin(orderNo)
  );
  var data = contentApi.callAPI(
    URLUtils.https(
      new URLAction("Order-InvoiceDownload", Site.current.ID),
      new URLParameter("token", encodedOrderNumber)
    ).toString()
  );
  return data;
}

function getConfirmationEmailData(orderNo) {
  Logger.info("getConfirmationEmailData triggered for orderNo : " + orderNo);
  var encodedOrderNumber = encodeURIComponent(
    encryptionHelper.encryptPin(orderNo)
  );
  var data = contentApi.callAPI(
    URLUtils.https(
      new URLAction("StaticContent-ConfirmationEmailContent", Site.current.ID),
      new URLParameter("token", encodedOrderNumber)
    ).toString()
  );
  return data;
}

function getCancelledEmailContent(orderNo) {
  Logger.info("getCancelledEmailContent triggered for orderNo : " + orderNo);
  var encodedOrderNumber = encodeURIComponent(
    encryptionHelper.encryptPin(orderNo)
  );
  var data = contentApi.callAPI(
    URLUtils.https(
      new URLAction("StaticContent-CancelledEmailContent", Site.current.ID),
      new URLParameter("token", encodedOrderNumber)
    ).toString()
  );
  return data;
}

function getShippedEmailContent(orderNo) {
  Logger.info("getShippedEmailContent triggered for orderNo : " + orderNo);
  var encodedOrderNumber = encodeURIComponent(
    encryptionHelper.encryptPin(orderNo)
  );
  var data = contentApi.callAPI(
    URLUtils.https(
      new URLAction("StaticContent-ShippedEmailContent", Site.current.ID),
      new URLParameter("token", encodedOrderNumber)
    ).toString()
  );
  return data;
}

module.exports = {
  getInvoice: getInvoice,
  getConfirmationEmailData: getConfirmationEmailData,
  getCancelledEmailContent: getCancelledEmailContent,
  getShippedEmailContent: getShippedEmailContent
};

