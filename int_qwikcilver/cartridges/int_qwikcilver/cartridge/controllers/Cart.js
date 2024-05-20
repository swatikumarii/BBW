'use strict';

/**
 * @namespace Cart
 */

var server = require('server');
server.extend(module.superModule);
var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
var BasketMgr = require('dw/order/BasketMgr');
var Site = require('dw/system/Site');
var enableQCeGift = Site.current.getCustomPreferenceValue('enableQwikcilver');
var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');

/**
 * Cart-AddProduct : The Cart-AddProduct endpoint check product price and retrun if price is zero
 * @name Cart-AddProduct
 */
server.prepend('AddProduct', function (req, res, next) {
    var productID = req.form.pid;
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var product = ProductMgr.getProduct(productID);
    var hasGiftProducts = qwikcilverHelpers.validateGiftProduct(currentBasket);
    var isProductLineItemsExist = false;
    var isGiftCardLineItemExist = false;
    if (hasGiftProducts === true) {
        isGiftCardLineItemExist = true;
    } else if (currentBasket.productLineItems.length > 0) {
        isProductLineItemsExist = true;
    }
    if (
        isGiftCardLineItemExist &&
        (product.custom.isEgiftCard === null ||
            product.custom.isEgiftCard === false)
    ) {
        res.json({
            isGiftCardLineItemExist: isGiftCardLineItemExist,
            pid: productID
        });
        this.emit('route:Complete', req, res);
        return;
    }

    if (isProductLineItemsExist && product.custom.isEgiftCard === true) {
        res.json({
            isProductLineItemsExist: isProductLineItemsExist,
            pid: productID
        });
        this.emit('route:Complete', req, res);
        return;
    }
    next();
});

/**
 * Save Gift product recipient's details in Pli
 */
server.append('AddProduct', function (req, res, next) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var productId = req.form.pid;
    var product = ProductMgr.getProduct(productId);
    var basket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();
    var months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
    ];
    var GCMonthindex;
    var currentMonthIndex = new Date().getMonth();

    Transaction.wrap(function () {
        if (
            enableQCeGift &&
            product.custom.isEgiftCard === true &&
            req.form.egiftCardDetails !== null
        ) {
            // Check product is eGift product or normal Product
            var egiftCardDetails = JSON.parse(req.form.egiftCardDetails);

            var recipientEmail = egiftCardDetails.recipientEmail;
            var senderName = egiftCardDetails.senderName;
            var recipientName = egiftCardDetails.recipientName;
            var eGiftMessage = egiftCardDetails.eGiftMessage || '';
            var eGiftScheduleDate = parseInt(
                egiftCardDetails.eGiftScheduleDate
                , 10);
            var eGiftScheduleMonth = egiftCardDetails.eGiftScheduleMonth;
            var eGiftVideoLink = egiftCardDetails.eGiftVideoLink;

            for (var i = 0; i < basket.productLineItems.length; i++) {
                if (
                    basket.productLineItems[i].custom.eGiftReceiverEmail ===
                    null
                ) {
                    basket.productLineItems[i].custom.eGiftReceiver =
                        recipientName;
                    basket.productLineItems[i].custom.eGiftReceiverEmail =
                        recipientEmail;
                    basket.productLineItems[i].custom.eGiftSender = senderName;
                    basket.productLineItems[i].custom.eGiftMessage =
                        eGiftMessage;
                    basket.productLineItems[i].custom.eGiftCardScheduleDay =
                        eGiftScheduleDate;
                    basket.productLineItems[i].custom.eGiftCardScheduleMonth =
                        eGiftScheduleMonth;
                    basket.productLineItems[i].custom.eGiftVideoLink =
                        eGiftVideoLink;
                    // Update year if the month of gift card scheduled is in next year
                    GCMonthindex = months.indexOf(eGiftScheduleMonth);
                    basket.productLineItems[i].custom.eGiftScheduledYear =
                        GCMonthindex >= currentMonthIndex
                            ? new Date().getFullYear().toFixed(0)
                            : (
                                Number(new Date().getFullYear().toFixed(0)) +
                                  1
                            ).toFixed(0);
                    basket.productLineItems[i].custom.isEgiftCard = true;
                    basket.productLineItems[i].custom.eGiftEmailPending = true;
                    break;
                }
            }
            viewData.cartHasGiftcard = true;

            viewData.eGiftMessage = eGiftMessage;
            viewData.recipientEmail = recipientEmail;
            viewData.recipientName = recipientName;
            viewData.senderName = egiftCardDetails.senderName;
            viewData.eGiftScheduleDate = eGiftScheduleDate;
            viewData.eGiftScheduleMonth = eGiftScheduleMonth;
        }
        // Reset Gift Card Total if cart is updated
        var applicableShippingMethods = ShippingMgr.getShipmentShippingModel(
            basket.getDefaultShipment()
        ).getApplicableShippingMethods();
        if (
            viewData.updateShippingMethod &&
            applicableShippingMethods &&
            applicableShippingMethods.length > 0
        ) {
            basket
                .getDefaultShipment()
                .setShippingMethod(applicableShippingMethods[0]);
        }
        res.setViewData(viewData);
    });
    next();
});

module.exports = server.exports();
