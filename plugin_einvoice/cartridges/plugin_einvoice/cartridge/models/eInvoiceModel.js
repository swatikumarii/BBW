'use-strict';

/**
 * Generates an e-invoice JSON object for a given order.
 * @param {dw.order.Order} order - The order object
 * @param {Object} refData - Reference data including erpId and currentDateTime
 * @param {Object} buyersData - Buyer information including tinNumber, regNumber, identificationType, and sstNumber
 * @returns {Object} - The e-invoice JSON object
 */
function eInvoice(order, refData, buyersData) {
    var Site = require('dw/system/Site');
    var System = require('dw/system/System');
    var einvoiveStatesCode = require('*/cartridge/scripts/constant/einvoice_states');
    var Logger = require('dw/system/Logger');
    var loggerEinvoice = Logger.getLogger('EInvoice');

    // Retrieve supplier information from custom preferences
    var supplierInformation = Site.getCurrent().getCustomPreferenceValue(
        'eInvoiceSupplierInfo'
    );

    if (supplierInformation) {
        supplierInformation = JSON.parse(supplierInformation);

        loggerEinvoice.info(
            'Supplier Information get successfully : ' +
                supplierInformation.supplier_name
        );

        // Generate invoice number using the erpId
        var invoiceNumber = order.invoiceNo || refData.erpId.toUpperCase();

        // Retrieve shipping and billing addresses
        var shippingInfo = order.shipments[0].shippingAddress;
        var billingInfo = order.billingAddress;

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
                billingStateCode = '00';
                shippingStateCode = '00';
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
        var enableShippingTax =
            Site.getCurrent().getCustomPreferenceValue(
                'eInvoiceEnableShippingTax'
            ) || false;

        loggerEinvoice.info(
            'Is enable shipping tax calculations : ' +
                Site.getCurrent().getCustomPreferenceValue(
                    'eInvoiceEnableShippingTax'
                )
        );

        // Initialize tax summary and tax type list
        var taxSummery = {};
        var taxTypeList = [];
        //relatred to product only
        var taxType = {
            tax_type: '06',
            tax_amount: 0,
            tax_exemption: 'NA',
            exempted_tax_amount: 0,
            taxable_amount: 0
        };
        taxTypeList.push(taxType);

        //OderLevelDiscount
        var orderLevelDiscount = order.getPriceAdjustments();
        var orderDiscount = 0;
        for (var k = 0; k < orderLevelDiscount.length; k++) {
            orderDiscount += Math.abs(orderLevelDiscount[k].basePrice.value);
        }
        //total price without adjustments and shipping
        var orderTotalPrice =
            order.getMerchandizeTotalPrice().value +
            order.getShippingTotalPrice().value;

        // Calculate tax summary based on whether shipping tax is enabled
        if (enableShippingTax && (!('isEgiftOrder' in  order.custom) || order.custom.isEgiftOrder == false)) {
            //totalExcludingTax further decuctions are through lineitems
            taxSummery.total_excluding_tax = orderTotalPrice - orderDiscount;

            //totalIncludingTax further decuctions are through lineitems
            taxSummery.total_including_tax = orderTotalPrice - orderDiscount;

            //total net amount
            taxSummery.total_net_amount = orderTotalPrice - orderDiscount;

            //total tax amount applicable to shipping only
            taxSummery.total_tax_amount =
                order.getAdjustedShippingTotalTax().value;

            //billing amount
            taxSummery.total_payable_amount = order.getTotalGrossPrice().value;

            var taxType = {
                tax_type: '02',
                tax_amount: order.getAdjustedShippingTotalTax().value || 0,
                tax_exemption: 'NA',
                exempted_tax_amount: 0,
                taxable_amount:
                    order.getAdjustedShippingTotalNetPrice().value || 0
            };
            taxTypeList.push(taxType);
        } else {
            //related to gift card

            taxSummery.total_excluding_tax = orderTotalPrice - orderDiscount;
            taxSummery.total_including_tax = orderTotalPrice - orderDiscount;
            taxSummery.total_tax_amount = 0;
            taxSummery.total_net_amount = orderTotalPrice - orderDiscount;
            taxSummery.total_payable_amount = order.getTotalGrossPrice().value;
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
                var priceAdjustments = orderLineItems[i].getPriceAdjustments();
                var adjustedPrice = 0;
                for (var j = 0; j < priceAdjustments.length; j++) {
                    adjustedPrice += Math.abs(
                        priceAdjustments[j].basePrice.value
                    );

                    //total exclusion product discount diduction
                    taxSummery.total_excluding_tax =
                        taxSummery.total_excluding_tax - adjustedPrice;
                    //total inclusive product discount diduction
                    taxSummery.total_including_tax =
                        taxSummery.total_including_tax - adjustedPrice;

                    taxSummery.total_net_amount =
                        taxSummery.total_net_amount - adjustedPrice;
                }
                var lineItem = {
                    classification: order.custom.isEgiftOrder ? '044' : '008',
                    description: orderLineItems[i].productName,
                    unit_price:
                        (orderLineItems[i].getBasePrice().value *
                            orderLineItems[i].quantityValue -
                            adjustedPrice) /
                        orderLineItems[i].quantityValue,
                    tax_type: '06',
                    tax_rate: 0,
                    tax_amount: 0,
                    tax_exemption: 'NA',
                    exempted_tax_amount: 0,
                    subtotal:
                        orderLineItems[i].getBasePrice().value *
                            orderLineItems[i].quantityValue -
                        adjustedPrice,
                    discount_amount: adjustedPrice,
                    total_excluding_tax:
                        orderLineItems[i].getBasePrice().value *
                            orderLineItems[i].quantityValue -
                        adjustedPrice,
                    quantity: orderLineItems[i].quantityValue
                };
                lineItemList.push(lineItem);
            } else if (orderLineItems[i] instanceof dw.order.ShippingLineItem) {
                // Create shipping line item
                var lineItem = {
                    classification: '008',
                    description: orderLineItems[i].getID(),
                    tax_exemption: 'NA',
                    exempted_tax_amount: 0,
                    quantity: 1
                };

                var priceAdjustments =
                    orderLineItems[i].getShippingPriceAdjustments();
                var adjustedPrice = 0;
                for (var j = 0; j < priceAdjustments.length; j++) {
                    adjustedPrice += Math.abs(
                        priceAdjustments[j].basePrice.value
                    );
                    //totalExcludingTax shipping adjustment
                    //total exclusion product discount diduction
                    taxSummery.total_excluding_tax =
                        taxSummery.total_excluding_tax - adjustedPrice;
                    taxSummery.total_net_amount =
                        taxSummery.total_net_amount - adjustedPrice;
                    taxSummery.total_including_tax =
                        taxSummery.total_including_tax - adjustedPrice;
                }

                if (
                    enableShippingTax &&
                    (!('isEgiftOrder' in order.custom) ||
                        order.custom.isEgiftOrder == false)
                ) {
                    var totalExcludingTax = 0;
                    var subTotal = 0;
                    var taxRate = 0;
                    var taxValue = 0;
                    if (orderLineItems[i].getAdjustedGrossPrice().value === 0) {
                        totalExcludingTax = 0;
                        subTotal = 0;
                        taxRate = 0;
                        taxValue = 0;
                        taxSummery.total_tax_amount = 0;
                        lineItem.unit_price = 0;
                    } else {
                        //gross price included of taxes
                        taxSummery.total_including_tax =
                            taxSummery.total_including_tax;

                        taxSummery.total_excluding_tax =
                            taxSummery.total_excluding_tax -
                            orderLineItems[i].tax.value;

                        totalExcludingTax =
                            orderLineItems[i].getAdjustedGrossPrice().value -
                            orderLineItems[i].tax.value;

                        taxSummery.total_net_amount =
                            taxSummery.total_net_amount -
                            orderLineItems[i].tax.value;

                        subTotal =
                            orderLineItems[i].basePrice.value -
                            orderLineItems[i].tax.value -
                            adjustedPrice;

                        taxRate = orderLineItems[i].taxRate;

                        taxValue = orderLineItems[i].tax.value;

                        lineItem.unit_price = subTotal;
                    }

                    lineItem.tax_type = '02';
                    lineItem.tax_rate = taxRate;
                    lineItem.tax_amount = taxValue;
                    lineItem.subtotal = subTotal;
                    lineItem.total_excluding_tax = totalExcludingTax;
                    lineItem.discount_amount = adjustedPrice;
                } else {
                    lineItem.tax_type = '06';
                    lineItem.tax_rate = 0;
                    lineItem.tax_amount = 0;
                    lineItem.subtotal =
                        orderLineItems[i].basePrice.value - adjustedPrice;
                    lineItem.total_excluding_tax =
                        orderLineItems[i].basePrice.value - adjustedPrice;
                    lineItem.discount_amount = adjustedPrice;
                    lineItem.unit_price =
                        orderLineItems[i].basePrice.value - adjustedPrice;
                }
                lineItemList.push(lineItem);
            }

            // Add line item to the list
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
                    supplier_tourismtax_number:
                        supplierInformation.supplier_tourismtax_number,
                    supplier_email: supplierInformation.supplier_email,
                    supplier_msic: supplierInformation.supplier_msic,
                    supplier_business_activity_description:
                        supplierInformation.supplier_business_activity_description,
                    supplier_contactnumber:
                        supplierInformation.supplier_contactnumber,
                    supplier_bank_account_number:
                        supplierInformation.supplier_bank_account_number,
                    supplier_address_line:
                        supplierInformation.supplier_address_line,
                    supplier_address_line2:
                        supplierInformation.supplier_address_line2,
                    supplier_address_line3:
                        supplierInformation.supplier_address_line3,
                    supplier_address_postalZone:
                        supplierInformation.supplier_address_postalZone,
                    supplier_address_city:
                        supplierInformation.supplier_address_city,
                    supplier_address_countrysubentitycode:
                        supplierInformation.supplier_address_countrysubentitycode,
                    supplier_address_country:
                        supplierInformation.supplier_address_country,
                    buyer_name: order.customerName,
                    buyer_tin: buyersData.tinNumber,
                    buyer_regnumber: buyersData.regNumber,
                    buyer_type: buyersData.identificationType,
                    buyer_sst: buyersData.sstNumber || '',
                    buyer_email: order.customerEmail,
                    buyer_contactnumber: billingInfo.phone,
                    buyer_address_line: billingInfo.address1,
                    buyer_address_line2: billingInfo.address2,
                    buyer_address_line3: '',
                    buyer_address_postalZone: billingInfo.postalCode,
                    buyer_address_city: billingInfo.city,
                    buyer_address_countrysubentitycode: billingStateCode,
                    buyer_address_country: 'MYS',
                    invoice_number: invoiceNumber,
                    invoice_type: '01',
                    original_invoice_number: '',
                    irb_original_invoice_number: '',
                    issue_date: refData.currentDateTime.toUTCString(),
                    currency_code: 'MYR',
                    bill_reference_number: order.invoiceNo,
                    tax_summary: taxSummery,
                    line: lineItemList
                }
            }
        };
    } else {
         loggerEinvoice.info(
             'Supplier Information not present.');
        return null;
    }
}

module.exports = { eInvoice: eInvoice };
