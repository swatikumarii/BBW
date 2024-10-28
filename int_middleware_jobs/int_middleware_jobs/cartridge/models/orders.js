var OrderMgr = require('dw/order/OrderMgr');
var TaxMgr = require('dw/order/TaxMgr');
var Locale = require('dw/util/Locale');
var Logger = require('dw/system/Logger');

var CONSTANTS = require('*/cartridge/scripts/constant/constants');

function firstCharToLower(str) {
    if (!str) return str;
    return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Function to get Level 1 and Level 2 parent categories of a product
 * @param {dw.catalog.Product} product to fetch L1 and L2 categories
 *
 */
function getParentCategories(product) {
    var categoryArray = [];

    // Check if the product exists and has a primary category
    if (product && product.primaryCategory) {
        var category = product.primaryCategory;

        while (!empty(category) && category.ID !== 'root') {
            categoryArray.push(category.ID);
            category = category.parent;
        }
    }

    return categoryArray;
}


/**
 * Add or update the key-value pair in the destination JSON object
 * @param {object} jsonObject
 * @param {object} newKeyValuePairs
 * @returns {object}
 */
function addKeyValuePairs(jsonObject, newKeyValuePairs) {
    // Loop through each key in the new key-value pairs object
    for (var key in newKeyValuePairs) {
        if (newKeyValuePairs.hasOwnProperty(key)) {
            // Add or update the key-value pair in the original JSON object
            jsonObject[key] = newKeyValuePairs[key];
        }
    }
    return jsonObject;
}

/**
 * Return localized formatted date
 *
 * Note: We can not get the timezone based timestamp.
 * Alternatively, we can get by formatting using `StringUtils` or print individually like `cal.get(dw.util.Calendar.DAY_OF_WEEK)`
 *
 * @param {Date} dateObj - Date object in GMT
 * @param {string} format - Date Formatting Scheme
 *
 * @return {string} Formatted string
 */
function getTimeZoneSpecificDate(dateObj, format) {
    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');
    var Site = require('dw/system/Site');

    var cal = new Calendar(new Date(dateObj));
    cal.setTimeZone(Site.getCurrent().timezone);

    return StringUtils.formatCalendar(cal, format);
}

/**
 * Copy  source object json to destination object
 * @param {Object} srcObject - source object
 * @param {Object} destObject - destination object
 * @returns {Object}
 */
function fetchCustomAttributes (srcObject, destObject) {
    if (empty(srcObject)) {
        return {};
    }

    // TODO: append job parameter to this array
    var skipAttributes = ['eGiftCardBarcode', 'eGiftCardExpiry', 'eGiftCardNumber', 'eGiftCardPin', 'eGiftReceiverEmail', 'emailRecommendationPids', 'Adyen_log', 'eghlLog', 'eGiftCardData', 'eGiftSender', 'eGiftReceiver'];

    var keys = Object.keys(srcObject.getCustom());
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var keyLCFirst = firstCharToLower(key);
        if ( !(skipAttributes.indexOf(key) > -1) ) {
            if (typeof srcObject.getCustom()[key] === 'number') {
                destObject[key] = parseFloat(srcObject.getCustom()[key]).toFixed(2);
            } else if (typeof srcObject.getCustom()[key] !== 'object') {
                destObject[key] = srcObject.getCustom()[key];
            } else {
                destObject[key] = srcObject.getCustom()[key].value;
            }
        }
    }
    return destObject;
}

function priceAdjustmentModel (priceAdjustments, newKeyValuePairs) {
    return !priceAdjustments.length ? CONSTANTS.NOT_APPLICABLE : (priceAdjustments.toArray().map(function (priceAdjustment) {
        var priceAdjustmentObj = {
            netPrice: priceAdjustment.netPrice ? priceAdjustment.netPrice.value.toFixed(2) : CONSTANTS.NOT_APPLICABLE,
            tax: priceAdjustment.tax ? priceAdjustment.tax.value.toFixed(2) : CONSTANTS.NOT_APPLICABLE,
            grossPrice: priceAdjustment.grossPrice ? priceAdjustment.grossPrice.value.toFixed(2) : CONSTANTS.NOT_APPLICABLE,
            basePrice: priceAdjustment.basePrice ? priceAdjustment.basePrice.value.toFixed(2) : CONSTANTS.NOT_APPLICABLE,
            linitemText: priceAdjustment.lineItemText,
            taxBasis: priceAdjustment.taxBasis ? priceAdjustment.taxBasis.value.toFixed(2) : CONSTANTS.NOT_APPLICABLE,
            taxRate: priceAdjustment.taxRate ? priceAdjustment.taxRate.value : CONSTANTS.NOT_APPLICABLE,
            promotionid: priceAdjustment.promotionID,
            campaignid: priceAdjustment.campaignID,
            couponid: priceAdjustment.basedOnCoupon && priceAdjustment.couponLineItem ? priceAdjustment.couponLineItem.couponCode : CONSTANTS.NOT_APPLICABLE,
            aBTestid: priceAdjustment.ABTestID,
            aBTestSegmentid: priceAdjustment.ABTestSegmentID,
            manual: priceAdjustment.manual
        };
        fetchCustomAttributes(priceAdjustment, priceAdjustmentObj);

        // Add obj json and add
        addKeyValuePairs(priceAdjustmentObj, newKeyValuePairs);

        return priceAdjustmentObj;
    }));


}

function formatOrderJSON(order) {
    if (!order) {
        return null;
    }

    var billingAddress = order.billingAddress;
    var productLineItems = order.productLineItems;

    var dateformat = 'MM/dd/yy';
    var timeFormat = 'hh:mm a z';

    var orderObj = {
        orderNo: order.orderNo,
        // orderDate: order.creationDate.toISOString(),
        orderDate: getTimeZoneSpecificDate(order.creationDate, dateformat),
        orderTime: getTimeZoneSpecificDate(order.creationDate, timeFormat),
        createdBy: order.createdBy,
        originalOrderNo: order.originalOrderNo || CONSTANTS.NOT_APPLICABLE,
        currentOrderNo: order.currentOrderNo || CONSTANTS.NOT_APPLICABLE,
        replacedOrderNo: order.replacedOrderNo || CONSTANTS.NOT_APPLICABLE,
        replacementOrderNo: order.replacementOrderNo || CONSTANTS.NOT_APPLICABLE,
        currency: order.getCurrencyCode(),
        customerLocale: order.customerLocaleID, // en_ID, id_ID
        countryCode: Locale.getLocale(order.customerLocaleID).country,
        invoiceNo: order.invoiceNo || CONSTANTS.NOT_APPLICABLE,
        taxation: TaxMgr.getTaxationPolicy() === TaxMgr.TAX_POLICY_GROSS ? CONSTANTS.TAX_POLICY.GROSS : CONSTANTS.TAX_POLICY.NET,
        customerType: order.getCustomer().isAuthenticated() ? CONSTANTS.CUSTOMER.REGISTERED : CONSTANTS.CUSTOMER.GUEST,
        customerName: order.customerName,
        billingAddress: function (billingAddress) {
            var billingAddressObj = {
                orderNo: order.orderNo,
                firstName: billingAddress.firstName,
                lastName: billingAddress.lastName,
                city: billingAddress.city,
                postalCode: billingAddress.postalCode,
                stateCode: billingAddress.stateCode,
                countryCode: billingAddress.countryCode.value
            };
            fetchCustomAttributes(billingAddress, billingAddressObj);

            return billingAddressObj;
        }(billingAddress),
        productLineItems: productLineItems.toArray().map(function (pli) {
            var pliObj = {
                orderNo: order.orderNo,
                shipmentid: pli.getShipment().getShipmentNo(),
                netPrice: pli.netPrice.value.toFixed(2),
                tax: pli.tax.value.toFixed(2),
                grossPrice: pli.grossPrice.value.toFixed(2),
                basePrice: pli.basePrice.value.toFixed(2),
                lineitemText: pli.lineItemText,
                productid: pli.productID,
                productName: pli.productName,
                quantity: pli.quantityValue,
                taxRate: pli.taxRate,
                gift: pli.gift,
                productPriceAdjustments: priceAdjustmentModel(pli.priceAdjustments, { orderNo: order.orderNo, productid: pli.productID}),
                bonusProductLineItem: pli.bonusProductLineItem
            };

            var categories = getParentCategories(pli.product);
            pliObj.categoryL1 = categories.length ? categories[categories.length - 1] : CONSTANTS.NOT_APPLICABLE;
            pliObj.categoryL2 = categories.length > 1 ? categories[categories.length - 2] : CONSTANTS.NOT_APPLICABLE;

            fetchCustomAttributes(pli, pliObj);
            return pliObj;
        }),
        shipments: order.shipments.toArray().map(function (shipment) {
            var shipmentObj = {
                orderNo: order.orderNo,
                shipmentid: shipment.getShipmentNo(),
                shippingStatus: shipment.shippingStatus.displayValue,
                shippingMethod: shipment.shippingMethod ? shipment.shippingMethod.displayName : CONSTANTS.NOT_APPLICABLE,
                firstName: shipment.shippingAddress ? shipment.shippingAddress.firstName : CONSTANTS.NOT_APPLICABLE,
                lastName: shipment.shippingAddress ? shipment.shippingAddress.lastName : CONSTANTS.NOT_APPLICABLE,
                city: shipment.shippingAddress ? shipment.shippingAddress.city : CONSTANTS.NOT_APPLICABLE,
                postalCode: shipment.shippingAddress ? shipment.shippingAddress.postalCode : CONSTANTS.NOT_APPLICABLE,
                stateCode: shipment.shippingAddress ? shipment.shippingAddress.stateCode : CONSTANTS.NOT_APPLICABLE,
                countryCode: shipment.shippingAddress ? shipment.shippingAddress.countryCode.value : CONSTANTS.NOT_APPLICABLE,
                merchandizeTotalNetPrice: shipment.merchandizeTotalNetPrice.value.toFixed(2),
                merchandizeTotalTax: shipment.merchandizeTotalTax.value.toFixed(2),
                merchandizeTotalGrossPrice: shipment.merchandizeTotalGrossPrice.value.toFixed(2),
                adjustedMerchandizeTotalNetPrice: shipment.adjustedMerchandizeTotalNetPrice.value.toFixed(2),
                adjustedMerchandizeTotalTax: shipment.adjustedMerchandizeTotalTax.value.toFixed(2),
                adjustedMerchandizeTotalGrossPrice: shipment.adjustedMerchandizeTotalGrossPrice.value.toFixed(2),
                shippingTotalNetPrice: shipment.shippingTotalNetPrice.value.toFixed(2),
                shippingTotalTax: shipment.shippingTotalTax.value.toFixed(2),
                shippingTotalGrossPrice: shipment.shippingTotalGrossPrice.value.toFixed(2),
                adjustedShippingTotalNetPrice: shipment.adjustedShippingTotalNetPrice.value.toFixed(2),
                adjustedShippingTotalTax: shipment.adjustedShippingTotalTax.value.toFixed(2),
                adjustedShippingTotalGrossPrice: shipment.adjustedShippingTotalGrossPrice.value.toFixed(2),
                lineitemText: shipment.shippingLineItems.length ? shipment.shippingLineItems[0].lineItemText : CONSTANTS.NOT_APPLICABLE,
                itemid: shipment.shippingLineItems.length ? shipment.shippingLineItems[0].ID : CONSTANTS.NOT_APPLICABLE,
                shippingPriceAdjustments: priceAdjustmentModel(shipment.shippingLineItems[0].shippingPriceAdjustments, { orderNo: order.orderNo, itemid: shipment.shippingLineItems[0].ID, shipmentid: shipment.getShipmentNo() })
            };

            fetchCustomAttributes(shipment, shipmentObj);
            fetchCustomAttributes(shipment.shippingLineItems[0], shipmentObj);

            return shipmentObj;
        }),

        merchandizeTotalNetPrice: order.merchandizeTotalNetPrice.value.toFixed(2),
        merchandizeTotalTax: order.merchandizeTotalTax.value.toFixed(2),
        merchandizeTotalGrossPrice: order.merchandizeTotalGrossPrice.value.toFixed(2),
        merchandizeTotalPrice: order.merchandizeTotalPrice.value.toFixed(2),

        adjustedMerchandizeTotalNetPrice: order.adjustedMerchandizeTotalNetPrice.value.toFixed(2),
        adjustedMerchandizeTotalTax: order.adjustedMerchandizeTotalTax.value.toFixed(2),
        adjustedMerchandizeTotalGrossPrice: order.adjustedMerchandizeTotalGrossPrice.value.toFixed(2),
        adjustedMerchandizeTotalPrice: order.adjustedMerchandizeTotalPrice.value.toFixed(2),

        shippingTotalNetPrice: order.shippingTotalNetPrice.value.toFixed(2),
        shippingTotalTax: order.shippingTotalTax.value.toFixed(2),
        shippingTotalGrossPrice: order.shippingTotalGrossPrice.value.toFixed(2),
        shippingTotalPrice: order.shippingTotalPrice.value.toFixed(2),

        adjustedShippingTotalNetPrice: order.adjustedShippingTotalNetPrice.value.toFixed(2),
        adjustedShippingTotalTax: order.adjustedShippingTotalTax.value.toFixed(2),
        adjustedShippingTotalGrossPrice: order.adjustedShippingTotalGrossPrice.value.toFixed(2),
        adjustedShippingTotalPrice: order.adjustedShippingTotalPrice.value.toFixed(2),

        giftCertificateTotalNetPrice: order.giftCertificateTotalNetPrice.value.toFixed(2),
        giftCertificateTotalTax: order.giftCertificateTotalTax.value.toFixed(2),
        giftCertificateTotalGrossPrice: order.giftCertificateTotalGrossPrice.value.toFixed(2),
        giftCertificateTotalPrice: order.giftCertificateTotalPrice.value.toFixed(2),

        orderTotalNetPrice: order.totalNetPrice.value.toFixed(2),
        orderTotalTax: order.totalTax.value.toFixed(2),
        orderTotalGrossPrice: order.totalGrossPrice.value.toFixed(2),

        orderPriceAdjustments: priceAdjustmentModel(order.priceAdjustments, { orderNo: order.orderNo }),

        orderStatus: order.status.displayValue,

        shippingStatus: order.defaultShipment.shippingStatus.displayValue,
        confirmationStatus: order.confirmationStatus.displayValue,
        paymentStatus: order.paymentStatus.displayValue,

        payments: order.paymentInstruments.toArray().map(function (payment) {
            var paymentObj = {
                orderNo: order.orderNo,
                cardType: payment.paymentMethod,
                giftCertificateid: payment.giftCertificateID || CONSTANTS.NOT_APPLICABLE,
                amount: payment.paymentTransaction.amount.value.toFixed(2),
                transactionid: payment.paymentTransaction.transactionID
            };
            fetchCustomAttributes(payment, paymentObj);
            fetchCustomAttributes(payment.paymentTransaction, paymentObj);
            return paymentObj;
        }),
        couponLineItems: !order.couponLineItems.length ? CONSTANTS.NOT_APPLICABLE : order.couponLineItems.toArray().map(function (couponLineItem) {
            var couponLineItemObj = {
                orderNo: order.orderNo,
                couponCode: couponLineItem.couponCode,
                statusCode: couponLineItem.statusCode,
                promotionid: couponLineItem.promotionID,
                basedOnCampaign: couponLineItem.basedOnCampaign,
                couponPriceAdjustments: priceAdjustmentModel(couponLineItem.priceAdjustments, { orderNo: order.orderNo, couponCode: couponLineItem.couponCode })
            };
            fetchCustomAttributes(couponLineItem, couponLineItemObj);

            return couponLineItemObj;
        })
        // ,
        // giftCertificateLineItems: order.allGiftCertificateLineItems.toArray().map(function (giftCertificateLineItem) {
        //     var giftCertificateLineItemObj = {
        //         orderNo: order.orderNo,
        //         recipientName: giftCertificateLineItem.recipientName,
        //         senderName: giftCertificateLineItem.senderName,
        //         productid: giftCertificateLineItem.getProductListItem() ? giftCertificateLineItem.getProductListItem().productid : CONSTANTS.NOT_APPLICABLE,
        //         shipmentid: giftCertificateLineItem.getShipment().getShipmentNo(),
        //         giftPriceAdjustments: priceAdjustmentModel(giftCertificateLineItem.priceAdjustments)
        //     };
        //     return giftCertificateLineItemObj;
        // }),
        // bonusDiscountLineItems: order.getBonusDiscountLineItems().toArray().map(function (bonusDiscountLineItem) {
        //     var bonusDiscountLineItemObj = {
        //         orderNo: order.orderNo,
        //         bonusChoiceRuleBased: bonusDiscountLineItem.bonusChoiceRuleBased,
        //         promotionid: bonusDiscountLineItem.promotionID,
        //         bonusProductLineItemsIds: bonusDiscountLineItem.bonusProductLineItems.toArray().map(function (bonusProductLineItem) {
        //             return bonusProductLineItem.productID;
        //         }).toString().replace(/,/g, "|")
        //     };

        //     return bonusDiscountLineItemObj;
        // })
    };

    fetchCustomAttributes(order, orderObj);

    return orderObj;
}

function orderModel(order) {
    var orderExportService = require('*/cartridge/scripts/service/orderExportService');

    var reqObj = formatOrderJSON(order);

    return orderExportService.executeService([reqObj]);
}

exports.orderModel = orderModel;
