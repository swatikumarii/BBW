'use strict';

var Logger = require('dw/system/Logger');
var log = Logger.getLogger('JobSendEgiftCardEmail', 'JobSendEgiftCardEmail');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');

/**
 * Send Egift Email on the Scheduled Date
 * @returns {status} job status
 */
function sendEgiftEmail() {
    try {
        var OrderMgr = require('dw/order/OrderMgr');
        var queryString = 'custom.eGiftEmailPending={0}';
        var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
        var currentMonth = qwikcilverHelpers.getCurrentMonth();
        var currentDate = qwikcilverHelpers.getCurrentDate();
        var locale = Site.getCurrent().defaultLocale;

        var orders = OrderMgr.searchOrders(queryString, 'creationDate desc', 'true');
        Transaction.wrap(function () {
            while (orders.hasNext()) {
                var order = orders.next();
                var eGiftEmailPending = order.custom.eGiftEmailPending;
                if (eGiftEmailPending) {
                    for (var i = 0; i < order.productLineItems.length; i++) {
                        var giftLineItem = order.productLineItems[i];
                        // Check Gift Scheduled date and Month
                        // If card details are already available, send Email else Call API
                        if (giftLineItem.custom.eGiftEmailPending && giftLineItem.custom.eGiftCardScheduleMonth === currentMonth && Number(giftLineItem.custom.eGiftCardScheduleDay) <= currentDate) {
                            if (!giftLineItem.custom.eGiftCardNumber) {
                                var qwikcilverApis = require('*/cartridge/scripts/service/qwikcilver/apis');
                                var giftCardAPIResult = qwikcilverApis.createGiftCards(order, i);
                                if (giftCardAPIResult && giftCardAPIResult.status === 'OK' && giftCardAPIResult.object) {
                                    var giftCard = JSON.parse(giftCardAPIResult.object);
                                    if (giftCard.ResponseCode === 0) {
                                        qwikcilverHelpers.saveGiftCardDetails(order, giftCard, 'Created', i);
                                        qwikcilverHelpers.sendGiftCardEmail(order, locale, true, true, i);

                                        log.info('Gift Card Email has been Sent to the Customer: OrderID: {0}', order.orderNo);
                                    } else {
                                        log.info('Error while Creating a Gift Card for OrderNo: {0}', order.orderNo);
                                        log.info('Gift Card Email is Not Sent to the Customer for OrderID: {0}', order.orderNo);
                                    }
                                } else if (giftCardAPIResult && giftCardAPIResult.errorMessage) {
                                    var giftCardObj = JSON.parse(giftCardAPIResult.errorMessage);
                                    log.error('SendEgiftCardEmail.js: Error: {0}', giftCardObj);
                                    qwikcilverHelpers.sendGiftCardEmail(order, locale, true, false, i);
                                    log.info('Gift Card Email is Not Sent to the Customer for OrderID: {0} and Item Number {1}', order.orderNo, i);
                                }
                            } else {
                                qwikcilverHelpers.sendGiftCardEmail(order, locale, true, true, i);
                            }
                        }
                    }
                    // Check Order eGift Email Pending status
                    var isEmailPending = false;
                    for (var j = 0; j < order.productLineItems.length; j++) {
                        var plitem = order.productLineItems[j];
                        if (plitem.custom.eGiftEmailPending) {
                            isEmailPending = true;
                            break;
                        }
                    }
                    if (isEmailPending) {
                        order.custom.eGiftEmailPending = true;
                    } else {
                        order.custom.eGiftEmailPending = false;
                    }
                }
            }
        });
    } catch (e) {
        log.error('SendEgiftCardEmail.js: Error while Sending EGift Email: {0}', e.message + e.stack + e.fileName + e.lineNumber);
    }
    return new Status(Status.OK);
}

module.exports = {
    sendEgiftEmail: sendEgiftEmail
};
