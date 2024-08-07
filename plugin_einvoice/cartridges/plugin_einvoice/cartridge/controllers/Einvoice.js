"use strict";

/**
 * @namespace Einvoice
 */

var server = require("server");
var URLUtils = require("dw/web/URLUtils");
var Resource = require("dw/web/Resource");
var csrfProtection = require("*/cartridge/scripts/middleware/csrf");
var einvoiceHelpers = require('*/cartridge/scripts/helpers/einvoiceHelpers');

/**
 * Handles GET requests to show e-invoice data
 * Validates the creation date of the order
 */
server.get(
  "Show",
  server.middleware.https,
  csrfProtection.validateAjaxRequest,
  function (req, res, next) {
    var OrderMgr = require("dw/order/OrderMgr");
    var order = OrderMgr.getOrder(orderId); // Retrieve order using orderId (orderId should be defined or passed in some way)
    
    // Return JSON response with the validity of the order's creation date
    res.json({
      isValid: einvoiceHelpers.isValidDate(order.creationDate)
    });
    return next();
  }
);

/**
 * Handles POST requests to submit e-invoice data
 * Validates and processes e-invoice submission
 */
server.post(
  "Submit",
  server.middleware.https,
  csrfProtection.validateAjaxRequest,
  function (req, res, next) {
    var OrderMgr = require("dw/order/OrderMgr");
    const UUIDUtils = require("dw/util/UUIDUtils");
    var EInvoiceApi = require("*/cartridge/scripts/service/eInvoiceApis");
    var EInvoiceMdl = require("*/cartridge/models/eInvoiceModel");
    var customObjectMgr = require("dw/object/CustomObjectMgr");
    var Transaction = require("dw/system/Transaction");
    const einvoiveStatusCode = require("*/cartridge/scripts/constant/einvoice_constant");

    // Retrieve parameters from the request
    const tinNumber = req.httpParameterMap.get("tinNumber").stringValue;
    const regNumber = req.httpParameterMap.get("regNumber").stringValue;
    const orderId = req.httpParameterMap.get("orderID").stringValue;
    const identificationType = req.httpParameterMap.get("identificationType").stringValue;
    const sstNumber = req.httpParameterMap.get("sSTNumber").stringValue || "NA";

    // Validate mandatory fields
    if (tinNumber === "" || regNumber === "") {
      res.json({
        status: false,
        type: "field_error",
        errorMsg: Resource.msg("field.server.error", "einvoice_modal", null),
      });
      return next();
    }

    try {
      var order = OrderMgr.getOrder(orderId); // Retrieve order using orderId

      // Validate order creation date
      if (!einvoiceHelpers.isValidDate(order.creationDate)) {
        res.json({
          status: false,
          errorMsg: Resource.msg("einvoice.submittion.date.error", "einvoice_modal", null),
        });
        return next();
      }

      // Check e-invoice status of the order
      if (!order.custom.hasOwnProperty("eInvoice_status") ||
        order.custom.eInvoice_status === einvoiveStatusCode.EINVOICESTATUSCODES.ERROR ||
        order.custom.eInvoice_status === einvoiveStatusCode.EINVOICESTATUSCODES.EMPTY) {
        
        // Get e-invoice token
        var tokenApiResponse = EInvoiceApi.getEInvoiceToken();
        if (tokenApiResponse.ok) {
          var response = JSON.parse(tokenApiResponse.object);

          // Prepare buyer's data
          const buyersData = {
            tinNumber: tinNumber,
            sstNumber: sstNumber,
            identificationType: identificationType,
            regNumber: regNumber,
          };

          // Prepare reference data
          var referenceData = {
            currentDateTime: new Date(),
            eRP_ID: UUIDUtils.createUUID(),
          };

          // Prepare token information
          const tokenInfo = {
            type: response.token_type,
            token: response.access_token,
            createDate: response.createdDate,
            validTill: response.validTill,
          };

          // Create invoice request JSON
          const invoiceRequestJson = EInvoiceMdl.eInvoice(order, referenceData, buyersData);

          // Submit e-invoice
          var submissionApiResponse = EInvoiceApi.postSubmission(invoiceRequestJson, tokenInfo, referenceData);
          if (submissionApiResponse.ok) {
            referenceData.invoiceId = invoiceRequestJson.invoiceId;
            referenceData.orderId = invoiceRequestJson.orderId;

            // Store e-invoice details in a custom object
            Transaction.wrap(function () {
              var backInStockObj = customObjectMgr.createCustomObject("eInvoice_details", referenceData.eRP_ID);
              backInStockObj.custom.order_id = referenceData.orderId;
              backInStockObj.custom.eInvoice_id = referenceData.invoiceId;
              backInStockObj.custom.mail_try_sent = false;

              // Update order custom attributes with e-invoice details
              order.custom.eInvoice_submittion_date = referenceData.currentDateTime;
              order.custom.eInvoice_erp_id = referenceData.eRP_ID;
              order.custom.eInvoice_number = referenceData.invoiceId;
              order.custom.eInvoice_status = "pending";
            });

            // Return success response
            res.json({
              status: true,
              successMsg: Resource.msg("einvoice.submittion.success", "einvoice_modal", null),
            });
          } else {
            // Handle submission error
            res.json({
              status: false,
              errorMsg: Resource.msg("einvoice.submittion.error", "einvoice_modal", null),
            });
          }
        } else {
          // Handle token validation error
          res.json({
            status: false,
            errorMsg: Resource.msg("einvoice.token.validation.error", "einvoice_modal", null),
          });
        }
      } else if (order.custom.eInvoice_status === einvoiveStatusCode.EINVOICESTATUSCODES.PENDING) {
        // Handle pending e-invoice status
        res.json({
          status: false,
          type: "e_invoice_status",
          errorMsg: Resource.msg("einvoice.pending.status", "einvoice_modal", null),
        });
      } else {
        // Handle other e-invoice statuses
        Transaction.wrap(function () {
          var backInStockObj = customObjectMgr.createCustomObject("eInvoice_details", order.custom.eInvoice_erp_id);
          backInStockObj.custom.order_id = order.custom.eInvoice_erp_id;
          backInStockObj.custom.eInvoice_id = order.custom.eInvoice_number;
          backInStockObj.custom.mail_try_sent = false;

          res.json({
            status: true,
            successMsg: Resource.msg("einvoice.submittion.success", "einvoice_modal", null),
          });
        });
      }
    } catch (ex) {
      // Handle any unexpected errors
      res.json({
        status: false,
        errorMsg: Resource.msg("einvoice.token.validation.error", "einvoice_modal", null),
      });
    }
    return next();
  }
);

module.exports = server.exports();
