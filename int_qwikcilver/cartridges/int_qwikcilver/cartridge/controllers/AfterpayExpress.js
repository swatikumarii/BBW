'use strict';

var server = require('server');
server.extend(module.superModule);
var URLUtils = require('dw/web/URLUtils');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var AfterpayCOHelpers = require('*/cartridge/scripts/checkout/afterpayCheckoutHelpers');
var AfterpayRefArchCOHelpers = require('int_afterpay_sfra_6/cartridge/scripts/checkout/afterpayRefArchCheckoutHelpers');
var Resource = require('dw/web/Resource');
var AfterpaySession = require('*/cartridge/scripts/util/afterpaySession');
var BasketMgr = require('dw/order/BasketMgr');
var LogUtils = require('*/cartridge/scripts/util/afterpayLogUtils');
var Logger = LogUtils.getLogger('AfterpayExpress');
var AfterpayShippingHelpers = require('*/cartridge/scripts/checkout/afterpayShippingHelpers');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Money = require('dw/value/Money');
var Transaction = require('dw/system/Transaction');
var apUtilities = require('*/cartridge/scripts/util/afterpayUtilities');
var sitePreferences = apUtilities.sitePreferencesUtilities;
var afterpayEnabled = sitePreferences.isAfterpayEnabled();
var expressCheckoutEnabled = sitePreferences.isExpressCheckoutEnabled();
var qwikcilverApis = require('*/cartridge/scripts/service/qwikcilver/apis');
var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');

/**
 * on error redirects to the checkout page
 * @param {object} res - response
 * @param {object} error - error
 */
function redirectToErrorDisplay(res, error) {
    AfterpaySession.clearSession();
    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', error));
}

/**
 * Deferred Flow
 * @param {object} req - request
 * @param {object} res - response
 * @param {object} next - next
 * @param {object} afterPayOrderResponse - Afterpay Order Response
 * @returns {object} - next
 */
function deferredShippingFlow(req, res, next, afterPayOrderResponse) {
    var currentBasket = BasketMgr.getCurrentBasket();

    AfterpayRefArchCOHelpers.addShippingAddressToBasket(currentBasket, afterPayOrderResponse.shipping);
    AfterpaySession.setShippingChecksum(AfterpayCOHelpers.computeBasketShippingChecksum(currentBasket));
    AfterpayCOHelpers.addConsumerToBasket(currentBasket, afterPayOrderResponse.consumer);
    if (afterPayOrderResponse.billing) {
        AfterpayCOHelpers.addBillingAddressToBasket(currentBasket, afterPayOrderResponse.billing);
    } else {
        // Use shipping address for billing if billing is not passed in
        AfterpayCOHelpers.addBillingAddressToBasket(currentBasket, afterPayOrderResponse.shipping);
    }

    // Recreate the payment instrument in case session changed
    Transaction.wrap(function () {
        AfterpayRefArchCOHelpers.removeAllNonGiftCertificatePayments(currentBasket);
        var apCheckoutUtilities = apUtilities.checkoutUtilities;
        var paymentMethodName = apCheckoutUtilities.getPaymentMethodName();
        currentBasket.createPaymentInstrument(paymentMethodName, new Money(0.0, currentBasket.currencyCode));
    });

    AfterpayRefArchCOHelpers.calculateAndSetPaymentAmount(currentBasket);
    AfterpaySession.setExpressCheckoutFinalizeFlow(true);
    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'shipping'));
    return next();
}

/**
 * Itegrated Flow
 * @param {object} req - request
 * @param {object} res - response
 * @param {object} next - next
 * @param {object} afterPayOrderResponse - Afterpay Order Response
 * @returns {object} - next
 */
function integratedShippingFlow(req, res, next, afterPayOrderResponse) {
    var currentBasket = BasketMgr.getCurrentBasket();

    var apOrderToken = AfterpaySession.getToken();
    // Shipping option chosen by the consumer
    var selectedShipOption = afterPayOrderResponse.shippingOptionIdentifier;

    var isStorePickup = false;
    if (AfterpayRefArchCOHelpers.shouldEnableExpressPickupMode(currentBasket)) {
        isStorePickup = true;
    }

    // For in-store pickup, the address will be the address of the store
    AfterpayRefArchCOHelpers.addShippingAddressToBasket(currentBasket, afterPayOrderResponse.shipping);
    AfterpaySession.setShippingChecksum(AfterpayCOHelpers.computeBasketShippingChecksum(currentBasket));

    if (!isStorePickup) {
        // Need to compute the cost given the chosen shipping selection
        var shipMethod = AfterpayShippingHelpers.getShippingMethodForID(selectedShipOption);
        if (!shipMethod) {
            Logger.error('Shipping method returned by Afterpay was invalid.');
            redirectToErrorDisplay(res, Resource.msg('expresscheckout.error.checkout', 'afterpay', null));
            return {emit: false};
        }
        AfterpayShippingHelpers.setBasketShippingMethod(currentBasket, shipMethod.ID);
    } else {
        // Should we get the address of the store? Or if it's instore pickup, we will never send
        // Store a checksum of the line items into the session. Check this before we do a capture.
        AfterpaySession.setExpressCheckoutInstorePickup(true);
    }
    var cartTotals = AfterpayShippingHelpers.calculateBasketTaxShipTotals(req, currentBasket);
    AfterpayCOHelpers.addConsumerToBasket(currentBasket, afterPayOrderResponse.consumer);

    if (afterPayOrderResponse.billing) {
        AfterpayCOHelpers.addBillingAddressToBasket(currentBasket, afterPayOrderResponse.billing);
    } else {
        // Use shipping address for billing if billing is not passed in
        AfterpayCOHelpers.addBillingAddressToBasket(currentBasket, afterPayOrderResponse.shipping);
    }
    var adjustCartResponse = { totalCost: cartTotals.totalCost };

    var amount = afterPayOrderResponse.amount.amount;
    var currency = afterPayOrderResponse.amount.currency;
    if ((adjustCartResponse.totalCost.value != amount) || (adjustCartResponse.totalCost.currencyCode != currency)) {
        // this can occur if session was modified while express checkout was in flight
        Logger.error('Amount returned by Afterpay did not match expected amount. Afterpay returned=' + amount + currency + ' Merchant computed=' + adjustCartResponse.totalCost.value + adjustCartResponse.totalCost.currencyCode);
        redirectToErrorDisplay(res, Resource.msg('expresscheckout.error.amountMismatch', 'afterpay', null));
        return {emit: false};
    }

    var buyNow = sitePreferences.isExpressCheckoutBuyNowEnabled();
    if (buyNow) {
        // create the payment transaction with Afterpay for the desired amount
        Transaction.wrap(function () {
            AfterpayRefArchCOHelpers.removeAllNonGiftCertificatePayments(currentBasket);
            var apCheckoutUtilities = apUtilities.checkoutUtilities;
            var paymentMethodName = apCheckoutUtilities.getPaymentMethodName();
            currentBasket.createPaymentInstrument(paymentMethodName, new Money(amount, currency));
            AfterpayRefArchCOHelpers.addShippingAddressToBasket(currentBasket, afterPayOrderResponse.shipping);
        });
        // puts initial state into paymentTransaction
        require('*/cartridge/scripts/checkout/afterpayUpdatePreapprovalStatus').getPreApprovalResult(currentBasket, {
            status: 'SUCCESS', orderToken: apOrderToken, apExpressCheckout: true
        });

        // Place the order
        // This logic is similar to AfterpayRedirect-HandleResponse, which is what gets called after Afterpay redirect flow returns to site
        var order = COHelpers.createOrder(currentBasket);
        // auth/capture payment
        var paymentStatusUpdated = require('*/cartridge/scripts/checkout/updatePaymentStatus').handlePaymentStatus(order);
        if (paymentStatusUpdated.authorized) {
            Transaction.begin();
            var orderPlacementStatus = OrderMgr.placeOrder(order);
            Transaction.commit();
            if (!orderPlacementStatus.error) {
                Transaction.wrap(function () {
                    order.custom.isEgiftOrder = true;
                });
                for (var index = 0; index < order.productLineItems.length; index++) {
                    var giftCardAPIResult = qwikcilverApis.createGiftCards(order, index);
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
                                return {emit: true};
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
                                return {emit: true};
                            }
                        }
                    }  else {
                        qwikcilverHelpers.sendGiftCardEmail(order, req.locale.id, false, false, index);
                        log.info('Error while Creating a Gift Card for OrderNo: {0}', order.orderNo);
                        log.info('Gift Card Email is Not Sent to the Customer for OrderID: {0}', order.orderNo);
                        if (index === order.productLineItems.length - 1 ) {
                            res.render('checkout/confirmOrder', {
                                orderID: order.orderNo,
                                orderToken: order.orderToken,
                                continueUrl: URLUtils.url('Order-Confirm').toString()
                            });
                            return {emit: true};
                        }
                    }
                }
                Transaction.begin();
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                order.setExportStatus(Order.EXPORT_STATUS_READY);
                Transaction.commit();
                res.render('checkout/confirmOrder', {
                    orderID: order.orderNo,
                    orderToken: order.orderToken,
                    continueUrl: URLUtils.url('Order-Confirm').toString()
                });
            } else {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order, false);
                });
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', Resource.msg('order.submission.error', 'afterpay', null)));
            }
        } else {
            Transaction.wrap(function () {
                OrderMgr.failOrder(order);
            });
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', paymentStatusUpdated.AfterpayOrderErrorMessage ? paymentStatusUpdated.AfterpayOrderErrorMessage : Resource.msg('apierror.flow.default', 'afterpay', null)));
        }
        return {emit: false};
    }
    Transaction.wrap(function () {
        AfterpayRefArchCOHelpers.removeAllNonGiftCertificatePayments(currentBasket);
        var apCheckoutUtilities = apUtilities.checkoutUtilities;
        var paymentMethodName = apCheckoutUtilities.getPaymentMethodName();
        currentBasket.createPaymentInstrument(paymentMethodName, new Money(amount, currency));
        AfterpayRefArchCOHelpers.addShippingAddressToBasket(currentBasket, afterPayOrderResponse.shipping);
    });
    AfterpaySession.setExpressCheckoutFinalizeFlow(true);
    // puts initial state into paymentTransaction
    require('*/cartridge/scripts/checkout/afterpayUpdatePreapprovalStatus').getPreApprovalResult(currentBasket, {
        status: 'SUCCESS', orderToken: apOrderToken, apExpressCheckout: true
    });
    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder'));
    return {emit: false};
}

server.prepend('PostAfterpayCheckoutFlow', server.middleware.https, function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var Site = require('dw/system/Site');
    var enableQCeGift = Site.current.getCustomPreferenceValue('enableQwikcilver');
    if (enableQCeGift) {
        var isGiftProductAvailable = qwikcilverHelpers.validateGiftProduct(currentBasket);
        if (isGiftProductAvailable) {
            if (!afterpayEnabled) {
                Logger.error('Afterpay not enabled.');
                res.redirect(URLUtils.url('Cart-Show'));
                return next();
            }
            if (!expressCheckoutEnabled) {
                Logger.error('Afterpay Express Checkout not enabled.');
                res.redirect(URLUtils.url('Cart-Show'));
                return next();
            }

            if (!currentBasket) {
                Logger.error('Cart is empty.');
                res.redirect(URLUtils.url('Cart-Show'));
                return next();
            }

            var apOrderToken = AfterpaySession.getToken();
            if (!apOrderToken) {
                AfterpaySession.clearSession();
                Logger.error('Missing token from session.');
                redirectToErrorDisplay(res, Resource.msg('expresscheckout.error.invalidsession', 'afterpay', null));
                return next();
            }

            // retrieve the order from Afterpay using api
            var afterPayOrderResponse = require('*/cartridge/scripts/util/getOrderToken').validateOrderToken(apOrderToken);
            if (afterPayOrderResponse.error) {
                Logger.error(afterPayOrderResponse.errorMessage || 'Unable to verify order token');
                redirectToErrorDisplay(res, afterPayOrderResponse.errorMessage || Resource.msg('expresscheckout.error.gettoken', 'afterpay', null));
                return next();
            }
            if (!afterPayOrderResponse.consumer || !afterPayOrderResponse.shipping) {
                Logger.error('Missing data from Afterpay Get Order.');
                redirectToErrorDisplay(res, Resource.msg('expresscheckout.error.checkout', 'afterpay', null));
                return next();
            }

            var expressCheckoutShippingStrategy = sitePreferences.getExpressCheckoutShippingStrategy();

            if ((!empty(AfterpaySession.getIsSplitShipment()) && AfterpaySession.getIsSplitShipment())) {
                expressCheckoutShippingStrategy = 'deferred';
            }

            // If this is deferred shipping, just call DeferredFlow()
            if (expressCheckoutShippingStrategy === 'deferred') {
                return deferredShippingFlow(req, res, next, afterPayOrderResponse);
            }

            var integratedShippingFlowResponse = integratedShippingFlow(req, res, next, afterPayOrderResponse);
            if (integratedShippingFlowResponse.emit) {
                return this.emit('route:Complete', req, res);
            }
            return next();
        }
    }
    return next();
});

module.exports = server.exports();
