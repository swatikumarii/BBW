'use strict';

/* API Includes */
var BasketMgr = require('dw/order/BasketMgr');

/* Script Modules */
var server = require('server');
server.extend(module.superModule);
var thresholdUtilities = require('*/cartridge/scripts/util/thresholdUtilities');


server.replace('updateCheckoutWidget', server.middleware.https, function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var updatedTemplate = 'util/afterpayMessage';
    var priceContext;
    var currentBasket = BasketMgr.getCurrentBasket();
    var totalPrice = currentBasket.totalGrossPrice;
    if ('custom' in currentBasket && currentBasket.custom.eGiftTotalAmount && currentBasket.custom.eGiftTotalAmount !== null) {
        totalPrice -= currentBasket.custom.eGiftTotalAmount;
    }
    var afterpayLimits = thresholdUtilities.checkThreshold(totalPrice);

    priceContext = {
        totalprice: totalPrice.value ? totalPrice.value : totalPrice,
        mpid: afterpayLimits.mpid,
        classname: 'checkout-afterpay-message'
    };

    var updatedWidget = renderTemplateHelper.getRenderedHtml(
        priceContext,
        updatedTemplate
    );

    res.json({
        error: false,
        updatedWidget: updatedWidget
    });

    next();
});

module.exports = server.exports();
