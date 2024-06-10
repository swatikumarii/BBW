/* eslint-disable no-param-reassign */

'use strict';

var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var Transaction = require('dw/system/Transaction');
var d = new Date();
var Logger = require('dw/system/Logger');
var logger = Logger.getLogger('QwikcilverService');
var sendgridPref = require('*/cartridge/scripts/service/sendgridPreference');

/**
 * Get current Month
 * @returns {string} monthsObj
 */
function getCurrentMonth() {
    return monthNames[d.getMonth()];
}

/**
 * Get Index Of Month
 * @returns {number} index
 */
function getCurrentDate() {
    return d.getDate();
}

/**
 * Get Index Of Month
 * @param {string} monthName name of month
 * @returns {number} index
 */
function getIndexOfMonths(monthName) {
    return monthNames.indexOf(monthName) + 1;
}

/**
 * Get 3 Months, start from current Month
 * @returns {Array} monthsObj
 */
function getMonths() {
    var monthsObj = [];
    var currentMonth= d.getMonth();
    monthsObj.push(monthNames[currentMonth]);
    if (currentMonth === 11) {
        monthsObj.push(monthNames[0]);
        monthsObj.push(monthNames[1]);
    } else if(currentMonth === 10) {
        monthsObj.push(monthNames[currentMonth + 1]);
        monthsObj.push(monthNames[0]);
    } else {
        monthsObj.push(monthNames[currentMonth + 1]);
        monthsObj.push(monthNames[currentMonth + 2]);
    }
    return monthsObj;
}

/**
 * Get Total no of Days of Months
 * @returns {Array} daysObj
 */
function getNoOfDaysOfMonth() {
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    var noOfDays = new Date(year, month, 0).getDate();
    var daysObj = [];
    for (var i = 1; i <= noOfDays; i++) {
        daysObj.push(i);
    }
    return daysObj;
}

/**
 * Save Gift Card Details
 * @param {object} basket - basket
 * @returns {boolean} basket - basket
 */
function validateGiftProduct(basket) {
    var isGiftProductAvailable = false;
    var lineItems = basket ? basket.getAllProductLineItems() : [];
    if (lineItems && lineItems.length > 0) {
        for (var i = 0; i < lineItems.length; i++) {
            if (lineItems[i].product.custom.isEgiftCard === true) {
                isGiftProductAvailable = true;
            }
        }
    }
    return isGiftProductAvailable;
}

/**
 * Encode String To Base64
 * @param {number} cardPin : cardPin
 * @returns {string} encodedCardPin: encodedCardPin
 */
function encodeToBase64(cardPin) {
    var encodedCardPin = dw.crypto.Encoding.toBase64(new dw.util.Bytes(cardPin, 'UTF-8'));
    return encodedCardPin;
}

/**
 * Decode Base64 String
 * @param {string} encodedCardPin :encodedCardPin
 * @returns {string} decodedCardPin: decodedCardPin
 */
function decodeFromBase64(encodedCardPin) {
    var decodedCardPin;
    if (!empty(encodedCardPin)) {
        try {
            decodedCardPin = dw.crypto.Encoding.fromBase64(encodedCardPin);
        } catch (e) {
            logger.error('Error in Decoding card pin FromBase64' + e.message);
        }
    }
    return decodedCardPin.toString();
}

/**
 * Save Gift Card Details
 * @param {dw.order} order - order
 * @param {object} giftCard - order
 * @param {string} status - status
 * @param {number} GCNumber - index of GC
 */
function saveGiftCardDetails(order, giftCard, status, GCNumber) {
    Transaction.wrap(function () {
        order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);

        // Save Card response details in PLI
        if (status === 'Created') {
            var pli = order.productLineItems[GCNumber];
            pli.custom.eGiftCardNumber = giftCard.Cards[0].CardNumber;
            pli.custom.eGiftCardPin = encodeToBase64(giftCard.Cards[0].CardPin);
            pli.custom.eGiftCardExpiry = giftCard.Cards[0].ExpiryDate;
            // pli.custom.cardStatus = giftCard.Cards[0].CardStatus;
            pli.custom.eGiftCardBarcode = giftCard.Cards[0].BarCode;
        }
    });
}

/**
 * prepareGiftCardEmailData function is responsible to prepare the GC email data
 * @param  {string} to to email address
 * @param  {string} emailSubject email subject
 * @param  {object} context email data
 * @returns {object} email Object
 */
function prepareGiftCardEmailData(to, emailSubject, context) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    return {
        personalizations: [
            {
                to: [
                    {
                        email: to
                    }
                ]
            }
        ],
        from: {
            email: sendgridPref.sendgridFromEmail
        },
        subject: emailSubject,
        content: [
            {
                type: 'text/html',
                value: renderTemplateHelper.getRenderedHtml(context, 'checkout/confirmation/confirmationEgiftEmailToRecipient')
            }
        ],
        // eslint-disable-next-line camelcase
        tracking_settings: {
            'click_tracking': {
                'enable': true,
                'enable_text': false
            }
        }
    };
}

/**
 * Sends a confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @param {boolean} sendPendingEmail sendPendingEmail
 * @param {boolean} cardIssued cardIssued
 * @param {string} GCNumber GCNumber
 * @returns {void}
 */
function sendGiftCardEmail(order, locale, sendPendingEmail, cardIssued, GCNumber) {
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var emailContentHelpers = require('*/cartridge/scripts/helpers/emailContentHelpers');
    var ContentMgr = require('dw/content/ContentMgr');
    var sendgridApi = require('*/cartridge/scripts/service/sendgridApi');
    var currentLocale = Locale.getLocale(locale);
    var emailMarkup = '';
    var barcodeEmailMarkup = '';
    var termsContent = ContentMgr.getContent('email-terms-and-conditions-block'); // Terms and Conditions Email Content
    var youGotContent = ContentMgr.getContent('email-you-got-it-block'); // Terms and Conditions Email Content

    if (!empty(termsContent) && termsContent.online) {
        emailMarkup = termsContent.custom.body.markup;
    }

    if (!empty(youGotContent) && youGotContent.online) {
        barcodeEmailMarkup = youGotContent.custom.body.markup;
    }

    var orderModel = new OrderModel(order, { countryCode: currentLocale.country, containerView: 'order' });

    var context = {
        order: orderModel
    };

    var Mail = require('dw/net/Mail');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var sentEmailRecipients = [];
    var giftCertificateLineItems = order.productLineItems;
    logger.info('Before updating order and shipping status for order id {0} is {1}', order.orderNo, order.status.displayValue);
    Transaction.wrap(function () {
        try {
            if (cardIssued && giftCertificateLineItems && giftCertificateLineItems.length > 0) {
                var giftLineItem = giftCertificateLineItems[GCNumber];
                var sendEmailNow = false;
                if (giftLineItem.custom.eGiftEmailPending && getCurrentMonth() === giftLineItem.custom.eGiftCardScheduleMonth && giftLineItem.custom.eGiftCardScheduleDay <= getCurrentDate()) {
                    sendEmailNow = true;
                }

                context = {
                    recipientEmail: giftLineItem.custom.eGiftReceiverEmail,
                    recipientName: giftLineItem.custom.eGiftReceiver,
                    order: orderModel,
                    content: emailContentHelpers.getEmailContent('normal-footer', 'email-header'),
                    markup: emailMarkup,
                    barCodeMarkup: barcodeEmailMarkup,
                    giftcardNumber: GCNumber,
                    sendEmailNow: sendEmailNow
                };

                if (sendEmailNow && sentEmailRecipients.indexOf(giftLineItem.custom.eGiftReceiverEmail) < 0) {
                    // If sendgrid is enable then trigger the GC email from sendgrid else SF SMTP
                    var receipientMail;
                    if (sendgridPref.isSendgridEnable) {
                        var emailRequest = prepareGiftCardEmailData(giftLineItem.custom.eGiftReceiverEmail, Resource.msg('subject.order.egift.detail.email', 'giftcards', null), context);
                        receipientMail = sendgridApi.sendEmail(emailRequest);
                        logger.info('recipientGiftEmail: GC email status of order id {0} is {1}',  orderModel.orderNumber, JSON.stringify(receipientMail));
                    } else {
                        var recipientGiftEmail = new Mail();
                        recipientGiftEmail.addTo(giftLineItem.custom.eGiftReceiverEmail);
                        recipientGiftEmail.setSubject(Resource.msg('subject.order.egift.detail.email', 'giftcards', null));
                        recipientGiftEmail.setFrom(Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com');
                        recipientGiftEmail.setContent(renderTemplateHelper.getRenderedHtml(context, 'checkout/confirmation/confirmationEgiftEmailToRecipient'), 'text/html', 'UTF-8');
                        receipientMail = recipientGiftEmail.send();
                        logger.info('recipientGiftEmail: GC email status, message and code of order id {0} is {1} {2} {3}',  orderModel.orderNumber, receipientMail.status, receipientMail.message, receipientMail.code);
                    }
                    if(Site.current.getCustomPreferenceValue('merchantEmailforGiftCard')){
                        var merchantGiftEmail = new Mail();
                        merchantGiftEmail.addTo(Site.current.getCustomPreferenceValue('merchantEmailforGiftCard'));
                        merchantGiftEmail.setSubject(Resource.msgf('subject.order.egift.detail.email', 'giftcards', null,orderModel.orderNumber));
                        merchantGiftEmail.setFrom(Site.current.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com');
                        merchantGiftEmail.setContent(renderTemplateHelper.getRenderedHtml(context, 'checkout/confirmation/confirmationEgiftEmailToRecipient'), 'text/html', 'UTF-8');
                        logger.info('merchantGiftEmail: GC email status, message and code of order id {0} is {1} {2} {3}',  orderModel.orderNumber, merchantGiftEmail.status, merchantGiftEmail.message, merchantGiftEmail.code);
                    }
                    if (giftLineItem.custom.eGiftReceiverEmail !== order.customerEmail) {
                        var acknowledgeEgiftEmail = new Mail();
                        acknowledgeEgiftEmail.setSubject(Resource.msg('subject.order.acknowledge.email', 'eGiftCard', null));
                        acknowledgeEgiftEmail.setFrom(Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com');
                        acknowledgeEgiftEmail.addTo(order.customerEmail);
                        acknowledgeEgiftEmail.setContent(renderTemplateHelper.getRenderedHtml(context, 'checkout/confirmation/acknowledgeEgiftEmail'), 'text/html', 'UTF-8');
                        acknowledgeEgiftEmail.send();
                    }
                    // Store Recipient's Email to check if Email is already sent or not
                    sentEmailRecipients.push(giftLineItem.custom.eGiftReceiverEmail);
                    // When Email sent successfully
                    giftLineItem.custom.eGiftEmailPending = false;
                } else {
                    order.custom.eGiftEmailPending = true;
                }
            }
            // Set Shipping Status as Shipped and Order status as Completed
            logger.info('setting order and shipping status and order id is {0}', order.orderNo);
            var Order = require('dw/order/Order');
            order.setShippingStatus(Order.SHIPPING_STATUS_SHIPPED);
            order.setStatus(Order.ORDER_STATUS_COMPLETED);
            logger.info('setting order and shipping status for order id {0} Done', order.orderNo);
            logger.info('After updating order and shipping status for order id {0} is {1}', order.orderNo, order.status.displayValue);
            // If Card is not created, Set Email pending status and Sent email through Job
            if (!cardIssued) {
                order.custom.eGiftEmailPending = true;
            }
        } catch (error) {
            logger.info('Error in GC status update or email is {0}', JSON.stringify(error));
        }
    });
    logger.info('updated order and shipping status for order id {0} is {1}', order.orderNo, order.status.displayValue);
    if (!sendPendingEmail && GCNumber === 0) {
        var confirmationEmail = new Mail();
        confirmationEmail.setFrom(Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com');
        confirmationEmail.setSubject(Resource.msgf('subject.order.confirmation.email', 'giftcards', null,orderModel.orderNumber));
        confirmationEmail.addTo(order.customerEmail);
        confirmationEmail.setContent(renderTemplateHelper.getRenderedHtml(context, 'checkout/confirmation/confirmationEgiftEmailToSender'), 'text/html', 'UTF-8');
        var confirmationEmailSend = confirmationEmail.send();
        logger.info('confirmationEmail: GC email status, message and code of order id {0} is {1} {2} {3}',  orderModel.orderNumber, confirmationEmailSend.status, confirmationEmailSend.message, confirmationEmailSend.code);
    }
}
/**
 * save GiftCard data in BM
 * @param {object} order order
 * @param {object} returnCard returnCard
 * @param {number} GCNumber GCNumber or index
 */
function saveGiftCardData(order, returnCard, GCNumber) {
    var giftCardData= [];
    giftCardData.push({
        recipientName: order.allProductLineItems[GCNumber].custom.eGiftReceiver,
        senderName: order.allProductLineItems[GCNumber].custom.eGiftSender,
        customerMessage: order.allProductLineItems[GCNumber].custom.eGiftMessage,
        receiverEmail: order.allProductLineItems[GCNumber].custom.eGiftReceiverEmail,
        scheduleDate: order.allProductLineItems[GCNumber].custom.eGiftCardScheduleDay + '/' + order.allProductLineItems[GCNumber].custom.eGiftCardScheduleMonth,
        eGiftCardNo: JSON.parse(returnCard.object).Cards[0].CardNumber,
        barCode: JSON.parse(returnCard.object).Cards[0].BarCode
    });
    var prevGCData = order.custom.eGiftCardData;
    if (prevGCData) {
        giftCardData = prevGCData + ',' + JSON.stringify(giftCardData);
    } else {
        giftCardData = JSON.stringify(giftCardData);
    }
    Transaction.wrap(function () {
        order.custom.eGiftCardData = giftCardData;
    });
}


/**
 * Save Gift Card Details IN Payment Instruments
 * @param {object} basket - basket
 * @param {string} cardNumber - cardNumber
 * @param {string} cardPin - cardPin
 * @param {object} cardsObj - cardsObj
 */
function updatePaymentInstruments(basket, cardNumber, cardPin, cardsObj) {
    var currentBasket = basket;
    var Money = require('dw/value/Money');
    Transaction.wrap(function () {
        if (cardsObj && cardsObj.length > 0) {
            for (var i = 0; i < cardsObj.length; i++) {
                var card = cardsObj[i];
                if (card.Balance > 0) {
                    var cardBalance;
                    var pendingAmount = (currentBasket.totalGrossPrice.value) - (currentBasket.custom.eGiftTotalAmount);
                    if (currentBasket.custom.eGiftTotalAmount === null && card.Balance >= currentBasket.totalGrossPrice.value) {
                        cardBalance = currentBasket.totalGrossPrice.value;
                    } else if (currentBasket.custom.eGiftTotalAmount !== null && card.Balance >= pendingAmount) {
                        cardBalance = pendingAmount;
                    } else {
                        cardBalance = card.Balance;
                    }
                    var eGiftTotalAmount = new Money(cardBalance, currentBasket.getCurrencyCode());
                    currentBasket.createPaymentInstrument(
                        'GIFT_CERTIFICATE', eGiftTotalAmount
                    );

                    // Update card details in payment instrument
                    var giftPaymentInstruments = currentBasket.getPaymentInstruments();
                    for (var j = 0; j < giftPaymentInstruments.length; j++) {
                        if (giftPaymentInstruments[j].custom.eGiftCardNumber === null) {
                            giftPaymentInstruments[j].custom.eGiftCardNumber = cardNumber;
                            giftPaymentInstruments[j].custom.eGiftCardPin = encodeToBase64(cardPin);
                            break;
                        }
                    }
                    // Update Basket gift total amount
                    if (giftPaymentInstruments.length > 1) {
                        eGiftTotalAmount = currentBasket.custom.eGiftTotalAmount + cardBalance;
                        currentBasket.custom.eGiftTotalAmount = eGiftTotalAmount;
                    } else {
                        currentBasket.custom.eGiftTotalAmount = cardBalance;
                    }
                }
            }
        }
    });
}

/**
 * Remove Gift Payment
 * @param {object} currentBasket - current basket
 */
function removeAllGiftPayments(currentBasket) {
    var paymentInstruments = currentBasket.getPaymentInstruments();
    var iterator = paymentInstruments.iterator();
    Transaction.wrap(function () {
        while (iterator.hasNext()) {
            var paymentInstrument = iterator.next();
            currentBasket.removePaymentInstrument(paymentInstrument);
        }
        currentBasket.custom.eGiftTotalAmount = 0;
    });
}

module.exports = {
    getMonths: getMonths,
    getNoOfDaysOfMonth: getNoOfDaysOfMonth,
    validateGiftProduct: validateGiftProduct,
    saveGiftCardDetails: saveGiftCardDetails,
    sendGiftCardEmail: sendGiftCardEmail,
    saveGiftCardData: saveGiftCardData,
    getIndexOfMonths: getIndexOfMonths,
    getCurrentMonth: getCurrentMonth,
    getCurrentDate: getCurrentDate,
    encodeToBase64: encodeToBase64,
    decodeFromBase64: decodeFromBase64,
    updatePaymentInstruments: updatePaymentInstruments,
    removeAllGiftPayments: removeAllGiftPayments
};
