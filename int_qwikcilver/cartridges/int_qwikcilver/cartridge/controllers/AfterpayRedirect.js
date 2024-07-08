'use strict';

var server = require('server');
server.extend(module.superModule);

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var qwikcilverApis = require('*/cartridge/scripts/service/qwikcilver/apis');
var ap = require('*/cartridge/scripts/util/afterpayUtilities');

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var BasketMgr = require('dw/order/BasketMgr');


/** saves afterpay payment method in payment instrument */
server.prepend('IsAfterpay',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var paymentMethodName = ap.checkoutUtilities.getPaymentMethodName();
        var apBrand = ap.brandUtilities.getBrand();
        var currentBasket = BasketMgr.getCurrentBasket();

        if (currentBasket.getPaymentInstruments('GIFT_CERTIFICATE').length > 0) {
            var paymentInstexists = false;
            var afterpayInstruments = currentBasket.getPaymentInstruments(paymentMethodName);
            var paymentInstruments = currentBasket.getPaymentInstruments();

            if (afterpayInstruments.length > 0 && afterpayInstruments.length === paymentInstruments.length) {
                paymentInstexists = true;
            } else if (currentBasket.getPaymentInstruments('GIFT_CERTIFICATE').length > 0) {
                paymentInstexists = true;
            } else {
                Transaction.wrap(function () {
                    currentBasket.createPaymentInstrument(
                        paymentMethodName, currentBasket.totalGrossPrice
                    );
                });
                paymentInstexists = true;
            }

            res.json({
                isAfterpay: paymentInstexists,
                resource: {
                    pleaseWait: Resource.msg('redirect.message', apBrand, null),
                    redirectMessage: Resource.msg('redirect.notification', apBrand, null)
                }
            });
            this.emit('route:Complete', req, res);
            return;
        }
        next();
    });
/**
 * processes the response returned by afterpay once the payment is done
 */
server.prepend('HandleResponse', server.middleware.https, function (req, res, next) {
    var Order = require('dw/order/Order');
    var productExists;
    var orderPlacementStatus;
    var paymentStatusUpdated;
    var paymentStatus = req.querystring.status;
    var currentBasket = BasketMgr.getCurrentBasket();

    var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
    var isGiftProductAvailable = qwikcilverHelpers.validateGiftProduct(currentBasket);
    if (isGiftProductAvailable || currentBasket.getPaymentInstruments('GIFT_CERTIFICATE').length > 0) {
        switch (paymentStatus) {
            case 'SUCCESS':
                productExists = require('*/cartridge/scripts/checkout/afterpayTokenConflict').checkTokenConflict(currentBasket, req.querystring.orderToken);
                require('*/cartridge/scripts/checkout/afterpayUpdatePreapprovalStatus').getPreApprovalResult(currentBasket, req.querystring);
                if (!productExists || productExists.error) {
                    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', Resource.msg('apierror.token.conflict', 'afterpay', null)));
                } else {
                    COHelpers.calculatePaymentTransaction(currentBasket);
                    var order = COHelpers.createOrder(currentBasket);
                    paymentStatusUpdated = require('*/cartridge/scripts/checkout/updatePaymentStatus').handlePaymentStatus(order);
                    if (paymentStatusUpdated.authorized) {
                        var giftCardAPIResult;
                        Transaction.begin();
                        orderPlacementStatus = OrderMgr.placeOrder(order);
                        Transaction.commit();
                        if (!orderPlacementStatus.error) {
                            Transaction.begin();
                            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                            order.setExportStatus(Order.EXPORT_STATUS_READY);
                            Transaction.commit();
                            if (isGiftProductAvailable) {
                                Transaction.wrap(function () {
                                    order.custom.isEgiftOrder = true;
                                });
                                for (var index = 0; index < order.productLineItems.length; index++) {
                                    giftCardAPIResult = qwikcilverApis.createGiftCards(order, index);
                                    if (giftCardAPIResult && giftCardAPIResult.errorMessage) {
                                        if ('status' in giftCardAPIResult && giftCardAPIResult.getStatus().equals('SERVICE_UNAVAILABLE')) {
                                            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', Resource.msg('qwikcilver.service.unavailable', 'qwikcilver', null)));
                                        } else if (giftCardAPIResult.msg !== 'Connection reset') {
                                            var errorMessageObj = JSON.parse(giftCardAPIResult.errorMessage);
                                            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', errorMessageObj.message));
                                        } else {
                                            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', Resource.msg('error.technical', 'checkout', null)));
                                        }
                                    }
                                    // Send GiftCard Email
                                    var log = dw.system.Logger.getLogger('QwikcilverService');
                                    if (giftCardAPIResult && giftCardAPIResult.status === 'OK' && giftCardAPIResult.object) {
                                        var giftCard = JSON.parse(giftCardAPIResult.object);
                                        if (giftCard.ResponseCode === 0) {
                                            qwikcilverHelpers.saveGiftCardDetails(order, giftCard, 'Created', index);
                                            qwikcilverHelpers.sendGiftCardEmail(order, req.locale.id, false, true, index);
                                            // log.info('Gift Card Email has been Sent to the Customer: OrderID: {0}', order.orderNo);
                                            if (index === order.productLineItems.length - 1 ) {
                                                res.render('checkout/confirmOrder', {
                                                    orderID: order.orderNo,
                                                    orderToken: order.orderToken,
                                                    continueUrl: URLUtils.url('Order-Confirm').toString()
                                                });
                                                return this.emit('route:Complete', req, res);
                                            }
                                        } else {
                                            qwikcilverHelpers.sendGiftCardEmail(order, req.locale.id, false, false, index);
                                            log.info('Error while Creating a Gift Card for OrderNo: {0}', order.orderNo);
                                            log.info('Gift Card Email is Not Sent to the Customer for OrderID: {0}', order.orderNo);
                                            if (index === order.productLineItems.length - 1 ) {
                                                res.render('checkout/confirmOrder', {
                                                    orderID: order.orderNo,
                                                    orderToken: order.orderToken,
                                                    continueUrl: URLUtils.url('Order-Confirm').toString()
                                                });
                                                return this.emit('route:Complete', req, res);
                                            }
                                        }
                                    }
                                }
                            }
                            res.render('checkout/confirmOrder', {
                                orderID: order.orderNo,
                                orderToken: order.orderToken,
                                continueUrl: URLUtils.url('Order-Confirm').toString()
                            });
                            return this.emit('route:Complete', req, res);
                        }
                        Transaction.wrap(function () {
                            OrderMgr.failOrder(order, false);
                        });
                        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', Resource.msg('order.submission.error', 'afterpay', null)));
                    } else {
                        Transaction.wrap(function () {
                            OrderMgr.failOrder(order);
                        });
                        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', paymentStatusUpdated.AfterpayOrderErrorMessage ? paymentStatusUpdated.AfterpayOrderErrorMessage : Resource.msg('apierror.flow.default', 'afterpay', null)));
                    }
                }
                break;
            case 'CANCELLED':
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', Resource.msg('afterpay.api.cancelled', 'afterpay', null)));
                break;
            default:
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', Resource.msg('apierror.flow.default', 'afterpay', null)));
                this.emit('route:Complete', req, res);
        }
    }
    return next();
});

module.exports = server.exports();
