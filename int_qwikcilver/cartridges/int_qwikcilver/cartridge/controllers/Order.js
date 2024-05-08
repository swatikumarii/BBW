'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var OrderMgr = require('dw/order/OrderMgr');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

server.prepend(
    'Confirm',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    // eslint-disable-next-line consistent-return
    function (req, res, next) {
        var Site = require('dw/system/Site');
        var enableQCeGift =
            Site.current.getCustomPreferenceValue('enableQwikcliver');
        var requestParameter = req.httpParameterMap;
        var requestOrderId = requestParameter.orderID.value;
        if (enableQCeGift && requestOrderId !== null) {
            var order = OrderMgr.getOrder(requestOrderId);

            var qwikcilverApis = require('*/cartridge/scripts/service/qwikcilver/apis');
            var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
            var isGiftProductAvailable =
                qwikcilverHelpers.validateGiftProduct(order);
            if (
                (isGiftProductAvailable &&
                    order.getPaymentInstruments('AdyenComponent').length > 0) ||
                order.getPaymentInstruments('CREDIT_CARD').length > 0
            ) {
                var giftCardAPIResult;
                var log = dw.system.Logger.getLogger('QwikcilverService');
                for (
                    var index = 0;
                    index < order.productLineItems.length;
                    index++
                ) {
                    // Create GiftCard
                    if (
                        order.productLineItems[index] &&
                        !(
                            'custom' in order.productLineItems[index] &&
                            'cardNumber' in
                                order.productLineItems[index].custom &&
                            order.productLineItems[index].custom.eGiftCardNumber
                        )
                    ) {
                        giftCardAPIResult = qwikcilverApis.createGiftCards(
                            order,
                            index
                        );
                        // Send GiftCard Email
                        if (
                            giftCardAPIResult &&
                            giftCardAPIResult.status === 'OK' &&
                            giftCardAPIResult.object
                        ) {
                            var giftCard = JSON.parse(giftCardAPIResult.object);
                            if (giftCard.ResponseCode === 0) {
                                qwikcilverHelpers.saveGiftCardDetails(
                                    order,
                                    giftCard,
                                    'Created',
                                    index
                                );
                                qwikcilverHelpers.sendGiftCardEmail(
                                    order,
                                    req.locale.id,
                                    false,
                                    true,
                                    index
                                );
                                if (
                                    index ===
                                    order.productLineItems.length - 1
                                ) {
                                    return next();
                                }
                            }
                        }
                    }
                }
                qwikcilverHelpers.sendGiftCardEmail(
                    order,
                    req.locale.id,
                    false,
                    false
                );
                log.info(
                    'Error while Creating a Gift Card for OrderNo: {0}',
                    order.orderNo
                );
                log.info(
                    'Gift Card Email is not Sent to the Customer for OrderID: {0}',
                    order.orderNo
                );
                this.emit('route:Complete', req, res);
                return true;
            }
            if (
                order.getPaymentInstruments('GIFT_CERTIFICATE').length > 0 &&
                order.getPaymentInstruments('AdyenComponent').length > 0
            ) {
                var giftCardAPIRedeemResult;
                // Handles Gift payment authorization
                COHelpers.handlePayments(order, order.orderNo);
                // Redeem Qwikcilver Gift Card
                if (
                    order.getPaymentInstruments('GIFT_CERTIFICATE').length > 0
                ) {
                    giftCardAPIRedeemResult =
                        qwikcilverApis.redeemGiftCards(order);
                    if (giftCardAPIRedeemResult) {
                        var redeemedGiftCard = JSON.parse(
                            giftCardAPIRedeemResult.object
                        );
                        if (redeemedGiftCard.ResponseCode === 0) {
                            qwikcilverHelpers.saveGiftCardDetails(
                                order,
                                redeemedGiftCard,
                                'Redeemed'
                            );
                            return next();
                        }
                    }
                }
            }
        }
        next();
    }
);

module.exports = server.exports();
