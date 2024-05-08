'use strict';

var server = require('server');
server.extend(module.superModule);

var Site = require('dw/system/Site');
var BasketMgr = require('dw/order/BasketMgr');

/**
 * Begin: Reset Gift Card Total on Page Refresh
 */
server.prepend('Begin', function (req, res, next) {
    var enableQCeGift = Site.current.getCustomPreferenceValue('qwikcilverEnableeGift');
    if (enableQCeGift) {
        var Transaction = require('dw/system/Transaction');
        Transaction.wrap(function () {
            var basket = BasketMgr.getCurrentBasket();
            if (basket !== null && req.querystring.stage !== 'placeOrder') {
                basket.custom.eGiftTotalAmount = 0;
            }
        });
    }
    next();
});

/**
 * Set GiftCard Balance URL
 * Check gift product
 */
server.append('Begin', function (req, res, next) {
    var enableQCeGift =
      Site.current.getCustomPreferenceValue('enableQwikcliver');
    var viewData = res.getViewData();
    var URLUtils = require('dw/web/URLUtils');
    if (enableQCeGift) {
        var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
        var basket = BasketMgr.getCurrentBasket();
        var isGiftProductAvailable = qwikcilverHelpers.validateGiftProduct(basket);
        if (isGiftProductAvailable) {
            viewData.isGiftProductAvailable = isGiftProductAvailable;
        }
        if ((basket.getPaymentInstruments('GIFT_CERTIFICATE').length > 0) && req.querystring.stage !== 'placeOrder') {
            qwikcilverHelpers.removeAllGiftPayments(basket);
        }
        viewData.afterpayApiError = req.querystring.afterpayErrorMessage || '';
        viewData.validateGiftCard = URLUtils.url('Giftcard-ValidateGiftCard').toString();
        viewData.checkGiftCardBalance = URLUtils.url('Giftcard-CheckBalance').toString();
        viewData.removeGiftPaymentUrl = URLUtils.url('Giftcard-RemoveGiftPayment').toString();
        viewData.updateAfterpayAmount = URLUtils.url('Giftcard-UpdateAfterpayAmount').toString();
        var giftCardForm = server.forms.getForm('giftCard');
        giftCardForm.clear();
        viewData.giftCardForm = giftCardForm;
        res.setViewData(viewData);
    }
    return next();
});

module.exports = server.exports();
