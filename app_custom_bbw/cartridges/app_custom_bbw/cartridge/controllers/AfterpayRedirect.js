'use strict';

var server = require('server');
server.extend(module.superModule);

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var BasketMgr = require('dw/order/BasketMgr');

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
    switch (paymentStatus) {
        case 'SUCCESS':
            productExists = require('*/cartridge/scripts/checkout/afterpayTokenConflict').checkTokenConflict(currentBasket, req.querystring.orderToken);
            require('*/cartridge/scripts/checkout/afterpayUpdatePreapprovalStatus').getPreApprovalResult(currentBasket, req.querystring);
            if (!productExists || productExists.error) {
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', Resource.msg('apierror.flow.invalid', 'afterpay', null)));
            } else {
                var order = COHelpers.createOrder(currentBasket);
                paymentStatusUpdated = require('*/cartridge/scripts/checkout/updatePaymentStatus').handlePaymentStatus(order);
                if (paymentStatusUpdated.authorized) {
                    Transaction.begin();
                    orderPlacementStatus = OrderMgr.placeOrder(order);
                    Transaction.commit();
                    if (!orderPlacementStatus.error) {
                        Transaction.begin();
                        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                        order.setExportStatus(Order.EXPORT_STATUS_READY);
                        Transaction.commit();
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
                    COHelpers.sendFailedOrderEmail(order, req.locale.id);
                    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', Resource.msg('order.submission.error', 'afterpay', null)));
                } else {
                    Transaction.wrap(function () {
                        OrderMgr.failOrder(order);
                    });
                    COHelpers.sendFailedOrderEmail(order, req.locale.id);
                    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', paymentStatusUpdated.AfterpayOrderErrorMessage ? paymentStatusUpdated.AfterpayOrderErrorMessage : Resource.msg('apierror.flow.default', 'afterpay', null)));
                }
            }
            break;
        case 'CANCELLED':
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', Resource.msg('afterpay.api.cancelled', 'afterpay', null)));
            break;
        default:
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'afterpayErrorMessage', Resource.msg('apierror.flow.default', 'afterpay', null)));
            return this.emit('route:Complete', req, res);
    }
    return next();
});

module.exports = server.exports();
