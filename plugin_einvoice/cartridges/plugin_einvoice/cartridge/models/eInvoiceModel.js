"use-strict";

/**
 * Generates an e-invoice JSON object for a given order.
 * @param {dw.order.Order} order - The order object
 * @param {Object} refData - Reference data including eRP_ID and currentDateTime
 * @param {Object} buyersData - Buyer information including tinNumber, regNumber, identificationType, and sstNumber
 * @returns {Object} - The e-invoice JSON object
 */
function eInvoice(order, refData, buyersData) {
  var Site = require("dw/system/Site");
  var System = require("dw/system/System");
  const einvoiveStatesCode = require("*/cartridge/scripts/constant/einvoice_states");

  // Retrieve supplier information from custom preferences
  const supplierInformation =
    Site.getCurrent().getCustomPreferenceValue("eInvoice_supplier_info") || {};
  supplierInformation = JSON.parse(supplierInformation);

  // Generate invoice number using the eRP_ID
  const invoiceNumber = "INV" + refData.eRP_ID;

  // Retrieve shipping and billing addresses
  const shippingInfo = order.shipments[0].shippingAddress;
  const billingInfo = order.billingAddress;

  var billingStateCode;
  var shippingStateCode;

  // Map state codes to e-invoice state codes based on the system instance type
  if (System.getInstanceType() == 0 || System.getInstanceType() == 1) {
    billingStateCode = einvoiveStatesCode.EINVOICESTATESCODES.filter(
      (x) => x.siteState === billingInfo.stateCode
    );
    shippingStateCode = einvoiveStatesCode.EINVOICESTATESCODES.filter(
      (x) => x.siteState === shippingInfo.stateCode
    );
    if (billingStateCode.length || shippingStateCode.length > 0) {
      billingStateCode = billingStateCode[0].code;
      shippingStateCode = shippingStateCode[0].code;
    } else {
      billingStateCode = "00";
      shippingStateCode = "00";
    }
  } else {
    billingStateCode = einvoiveStatesCode.EINVOICESTATESCODES.filter(
      (x) => x.siteState === billingInfo.stateCode
    )[0].code;
    shippingStateCode = einvoiveStatesCode.EINVOICESTATESCODES.filter(
      (x) => x.siteState === shippingInfo.stateCode
    )[0].code;
  }

  // Determine if shipping tax should be included
  const enableShippingTax =
    Site.getCurrent().getCustomPreferenceValue(
      "eInvoice_enable_shipping_tax"
    ) || false;

  // Initialize tax summary and tax type list
  var taxSummery = {};
  var taxTypeList = [];
  var taxType = {
    tax_type: "06",
    tax_amount: 0,
    tax_exemption: "",
    exempted_tax_amount: 0,
    taxable_amount: 0,
  };
  taxTypeList.push(taxType);

  // Calculate tax summary based on whether shipping tax is enabled
  if (enableShippingTax && order.custom.isEgiftOrder == false) {
    taxSummery.total_excluding_tax =
      order.getAdjustedMerchandizeTotalGrossPrice().value -
      order.getAdjustedShippingTotalTax().value;
    taxSummery.total_including_tax =
      order.getAdjustedMerchandizeTotalGrossPrice().value;
    taxSummery.total_tax_amount = order.getAdjustedShippingTotalTax().value;
    taxSummery.total_net_amount =
      order.getAdjustedMerchandizeTotalGrossPrice().value -
      order.getAdjustedShippingTotalTax().value;
    taxSummery.total_payable_amount =
      order.getAdjustedMerchandizeTotalGrossPrice().value;
    var taxType = {
      tax_type: "02",
      tax_amount: order.getAdjustedShippingTotalTax().value || 0,
      tax_exemption: "",
      exempted_tax_amount: 0,
      taxable_amount: order.getAdjustedShippingTotalNetPrice().value || 0,
    };
    taxTypeList.push(taxType);
  } else {
    taxSummery.total_excluding_tax =
      order.getAdjustedMerchandizeTotalGrossPrice().value;
    taxSummery.total_including_tax =
      order.getAdjustedMerchandizeTotalGrossPrice().value;
    taxSummery.total_tax_amount = 0;
    taxSummery.total_net_amount = order.getAdjustedMerchandizeTotalGrossPrice().value;
    taxSummery.total_payable_amount =
      order.getAdjustedMerchandizeTotalGrossPrice().value;
  }
  taxSummery.tax_type = taxTypeList;

  // Initialize line item list
  var orderLineItems = order.getAllLineItems();
  var lineItemList = [];

  // Iterate through line items to create line item objects
  // to-do discounts should be substract from all the subtotals
  for (var i = 0; i < orderLineItems.length; i++) {
    if (orderLineItems[i] instanceof dw.order.ProductLineItem) {
      // Create product line item
      var lineItem = {
        classification: order.custom.isEgiftOrder ? "044" : "008",
        description: orderLineItems[i].productName,
        unit_price: orderLineItems[i].getBasePrice().value,
        tax_type: "06",
        tax_rate: 0,
        tax_amount: 0,
        tax_exemption: "",
        exempted_tax_amount: 0,
        subtotal: orderLineItems[i].getAdjustedGrossPrice().value,
        total_excluding_tax: orderLineItems[i].getAdjustedGrossPrice().value,
        quantity: orderLineItems[i].quantityValue        
      };
    } else if (orderLineItems[i] instanceof dw.order.ShippingLineItem) {
      // Create shipping line item
      var lineItem = {
        classification: "008",
        description: orderLineItems[i].getID(),
        unit_price: orderLineItems[i].getAdjustedGrossPrice().value || 0,
        tax_exemption: "",
        exempted_tax_amount: 0,
        quantity: 1     
      };

      if (enableShippingTax && order.custom.isEgiftOrder == false) {
        lineItem.tax_type = "02";
        lineItem.tax_rate = orderLineItems[i].taxRate;
        lineItem.tax_amount = orderLineItems[i].tax.value;
        lineItem.subtotal = orderLineItems[i].getAdjustedGrossPrice().value - orderLineItems[i].tax.value;
        lineItem.total_excluding_tax = orderLineItems[i].getAdjustedGrossPrice().value - orderLineItems[i].tax.value;
      } else {
        lineItem.tax_type = "06";
        lineItem.tax_rate = 0;
        lineItem.tax_amount = 0;
        lineItem.subtotal = orderLineItems[i].getAdjustedGrossPrice().value;
        lineItem.total_excluding_tax = orderLineItems[i].getAdjustedGrossPrice().value;
      }
    }

    // Add line item to the list
    lineItemList.push(lineItem);
  }

  // Return the constructed e-invoice JSON object
  return {
    invoiceId: invoiceNumber,
    orderId: order.orderNo,
    jsonBody: {
      document: {
        supplier_name: supplierInformation.supplier_name,
        supplier_tin: supplierInformation.supplier_tin,
        supplier_regnumber: supplierInformation.supplier_regnumber,
        supplier_type: supplierInformation.supplier_type,
        supplier_sst: supplierInformation.supplier_sst,
        supplier_tourismtax_number: supplierInformation.supplier_tourismtax_number,
        supplier_email: supplierInformation.supplier_email,
        supplier_msic: supplierInformation.supplier_msic,
        supplier_business_activity_description: supplierInformation.supplier_business_activity_description,
        supplier_contactnumber: supplierInformation.supplier_contactnumber,
        supplier_bank_account_number: supplierInformation.supplier_bank_account_number,
        supplier_address_line: supplierInformation.supplier_address_line,
        supplier_address_line2: supplierInformation.supplier_address_line2,
        supplier_address_line3: supplierInformation.supplier_address_line3,
        supplier_address_postalZone: supplierInformation.supplier_address_postalZone,
        supplier_address_city: supplierInformation.supplier_address_city,
        supplier_address_countrysubentitycode: supplierInformation.supplier_address_countrysubentitycode,
        supplier_address_country: supplierInformation.supplier_address_country,
        buyer_name: order.customerName,
        buyer_tin: buyersData.tinNumber,
        buyer_regnumber: buyersData.regNumber,
        buyer_type: buyersData.identificationType,
        buyer_sst: buyersData.sstNumber || "",
        buyer_email: order.customerEmail,
        buyer_contactnumber: billingInfo.phone,
        buyer_address_line: billingInfo.address1,
        buyer_address_line2: billingInfo.address2,
        buyer_address_line3: "",
        buyer_address_postalZone: billingInfo.postalCode,
        buyer_address_city: billingInfo.city,
        buyer_address_countrysubentitycode: billingStateCode,
        buyer_address_country: "MYS",
        invoice_number: invoiceNumber,
        invoice_type: "01",
        original_invoice_number: "",
        irb_original_invoice_number: "",
        issue_date: refData.currentDateTime.toUTCString(),
        currency_code: "MYR",
        bill_reference_number: order.invoiceNo,
        tax_summary: taxSummery,
        line: lineItemList,
      },
    },
  };
}

module.exports = { eInvoice: eInvoice };
