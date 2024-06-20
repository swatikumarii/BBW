'use strict';

var server = require('server');

var ProductFactory = require('*/cartridge/scripts/factories/product');
var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var URLUtils = require('dw/web/URLUtils');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var collection = require('*/cartridge/scripts/util/collections');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var formatMoney = require('dw/util/StringUtils').formatMoney;

server.get('Show', function (req, res, next) {
    var giftCardId = req.querystring.pid;
    var giftCard = ProductFactory.get({pid: giftCardId});
    var recepientForm = server.forms.getForm('recipients');
    var months = qwikcilverHelpers.getMonths();
    var days = qwikcilverHelpers.getNoOfDaysOfMonth();
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var removeLineItemURL = URLUtils.url('Giftcard-RemoveLineItems');
    var breadcrumbs = productHelper.getAllBreadcrumbs(null, giftCardId, []).reverse();


    res.render('giftcard/details', {
        giftCard: giftCard,
        recepientForm: recepientForm,
        months: months,
        days: days,
        addToCartUrl: addToCartUrl,
        removeLineItemURL: removeLineItemURL,
        breadcrumbs: breadcrumbs
    });
    next();
});

/**
 * Remove GiftLineItem or ProductLineItem while adding Normal or gift product to the Cart
 */
server.get('RemoveLineItems', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();

    Transaction.wrap(function () {
        var productLineItems = currentBasket.getAllProductLineItems();
        if (productLineItems && productLineItems.length > 0) {
            for (var j = 0; j < productLineItems.length; j++) {
                var pli = productLineItems[j];
                currentBasket.removeProductLineItem(pli);
            }
        }
    });
    res.json({
        removeMessage: Resource.msg(
            'lineitems.removed.success.message',
            'giftcards',
            null
        )
    });
    return next();
});


/**
 * Validate Gift Cards
 * Call Qwikcilver API
 */
server.post('ValidateGiftCard', function (req, res, next) {
    var qwikcilverApis = require('*/cartridge/scripts/service/qwikcilver/apis');
    var Site = require('dw/system/Site');
    var paymentIterator;
    var addedCards = [];
    var hideCreditCardForm = true;
    var basketModel;
    var currencyCode = session.currency.currencyCode;
    var currency = currencyCode;
    var cardNumber = req.form.cardNo;
    var cardPin = req.form.cardPin;
    if (cardNumber && cardPin) {
        // Check pli item shouldn't be a gift Product
        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            res.json({
                error: true,
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();
        }
        // Check Existing Card Payment Instrument
        var giftPaymentInstruments = currentBasket.getPaymentInstruments();
        if (giftPaymentInstruments.length === 0) {
            paymentIterator = giftPaymentInstruments.iterator();
            Transaction.wrap(function () {
                while (paymentIterator.hasNext()) {
                    var paymentInstrument = paymentIterator.next();
                    currentBasket.removePaymentInstrument(paymentInstrument);
                }
            });
        }
        var noOfGiftCardRedemption = Site.current.getCustomPreferenceValue('qwikcilverNoofGiftCardRedemption');
        if (giftPaymentInstruments.length === noOfGiftCardRedemption) {
            res.json({
                error: true,
                errorMessage: Resource.msgf('error.payment.for.gift.limit', 'giftcards', null, noOfGiftCardRedemption)
            });
            return next();
        }
        var isGiftProductAvailable = qwikcilverHelpers.validateGiftProduct(currentBasket);
        if (isGiftProductAvailable) {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.payment.for.gift.product', 'giftcards', null)
            });
            return next();
        }
        if (currentBasket.getPaymentInstruments('GIFT_CERTIFICATE').length === 0) {
            Transaction.wrap(function () {
                currentBasket.custom.eGiftTotalAmount = 0;
            });
        }

        if (currentBasket.custom.eGiftTotalAmount === currentBasket.totalGrossPrice.value) {
            res.json({
                error: false,
                noPendingAmount: Resource.msg('payment.no.pending.gift.amount', 'giftcards', null),
                cardNumber: cardNumber,
                hideCreditCardForm: hideCreditCardForm
            });
            return next();
        }

        if (giftPaymentInstruments.length > 0) {
            for (var j = 0; j < giftPaymentInstruments.length; j++) {
                if (giftPaymentInstruments[j].paymentMethod !== 'GIFT_CERTIFICATE') {
                    currentBasket.removePaymentInstrument(giftPaymentInstruments[j]);
                }
                if (cardNumber === giftPaymentInstruments[j].custom.eGiftCardNumber) {
                    res.json({
                        error: true,
                        errorMessage: Resource.msg('payment.card.already.exist', 'giftcards', null),
                        cardNumber: cardNumber,
                        addedCards: addedCards
                    });
                    return next();
                }
            }
        }
        var minRedemptionAmount = Site.current.getCustomPreferenceValue('qwikcilverMinRedemptionAmount');
        if ((currentBasket.totalGrossPrice.value - currentBasket.custom.eGiftTotalAmount) < minRedemptionAmount) {
            res.json({
                error: true,
                cardNumber: cardNumber,
                hideCreditCardForm: false,
                errorMessage: 'Cannot Add gift card amount less than ' + currency + minRedemptionAmount
            });
            return next();
        }
        // Validate Card
        var giftCardAPIResult = qwikcilverApis.validateGiftCard(cardNumber, cardPin);
        if (giftCardAPIResult && giftCardAPIResult.status === 'OK') {
            var validateGiftCard = JSON.parse(giftCardAPIResult.object);
            if (validateGiftCard.ResponseCode !== 0 && validateGiftCard.Cards && validateGiftCard.Cards[0].ResponseCode !== 0) {
                if (validateGiftCard.Cards[0].ResponseCode === 10638) {
                    res.json({
                        error: true,
                        cardNumber: cardNumber,
                        errorMessage: Resource.msg('qwikcilver.invalid.gift.card', 'giftcards', null)
                    });
                } else {
                    res.json({
                        error: true,
                        cardNumber: cardNumber,
                        errorMessage: validateGiftCard.Cards[0].ResponseMessage
                    });
                }
                return next();
            }
            if (validateGiftCard.Cards[0].Balance < minRedemptionAmount) {
                res.json({
                    error: true,
                    cardNumber: cardNumber,
                    hideCreditCardForm: false,
                    errorMessage: 'Cannot Add gift card amount less than ' + currency + minRedemptionAmount
                });
                return next();
            }
            if (validateGiftCard.ResponseCode !== 0 && validateGiftCard.Cards && validateGiftCard.Cards[0].ResponseCode === 0) {
                res.json({
                    error: true,
                    cardNumber: cardNumber,
                    errorMessage: validateGiftCard.ResponseMessage
                });
                return next();
            }
            qwikcilverHelpers.updatePaymentInstruments(currentBasket, cardNumber, cardPin, validateGiftCard.Cards);

            if (currentBasket.getPaymentInstruments('GIFT_CERTIFICATE').length > 0) {
                var updatedPaymentInstruments = currentBasket.getPaymentInstruments();
                for (var k = 0; k < updatedPaymentInstruments.length; k++) {
                    var cardNo = updatedPaymentInstruments[k].custom.eGiftCardNumber;
                    var cardValue = updatedPaymentInstruments[k].paymentTransaction.amount;
                    if (cardNo !== null) {
                        addedCards.push({ cardNo: cardNo , amount: formatMoney(cardValue)});
                    }
                }
                var noPendingAmount = currentBasket.custom.eGiftTotalAmount === currentBasket.totalGrossPrice.value;
                if (!noPendingAmount) {
                    hideCreditCardForm = false;
                }
            }
            var CartModel = require('*/cartridge/models/cart');
            basketModel = new CartModel(currentBasket);

            if (currentBasket.custom.eGiftTotalAmount < currentBasket.totalGrossPrice.value) {
                var remainingAmount = currentBasket.totalGrossPrice.value - currentBasket.custom.eGiftTotalAmount;
                var hideAfterPay = false;
                if (remainingAmount <= 35 || remainingAmount >= 1000) {
                    hideAfterPay = true;
                }
                res.json({
                    error: false,
                    success: Resource.msgf('qwikcilver.card.pending', 'giftcards', null, currency, remainingAmount.toFixed(2)),
                    cardNumber: cardNumber,
                    hideCreditCardForm: false,
                    addedCards: addedCards,
                    basketModel: basketModel,
                    hideAfterPay: hideAfterPay
                });
                return next();
            }
        } else if (giftCardAPIResult && giftCardAPIResult.errorMessage) {
            if ('status' in giftCardAPIResult && giftCardAPIResult.getStatus().equals('SERVICE_UNAVAILABLE')) {
                res.json({
                    error: true,
                    errorMessage: Resource.msg('qwikcilver.service.unavailable', 'giftcards', null)
                });
            } else if (giftCardAPIResult.msg === 'Connection reset') {
                res.json({
                    error: true,
                    errorMessage: giftCardAPIResult.msg
                });
            } else {
                var errorMessageObj = JSON.parse(giftCardAPIResult.errorMessage);
                res.json({
                    error: true,
                    errorMessage: errorMessageObj.ResponseMessage
                });
            }
            return next();
        } else {
            res.json({
                error: true,
                errorMessage: Resource.msg('qwikcilver.service.unavailable', 'giftcards', null)
            });
            return next();
        }
    } else {
        res.json({
            error: true,
            errorMessage: Resource.msg('enter.giftcard.and.pin', 'giftcards', null)
        });
        return next();
    }
    res.json({
        error: false,
        noPendingAmount: Resource.msg('payment.no.pending.gift.amount', 'giftcards', null),
        cardNumber: cardNumber,
        hideCreditCardForm: hideCreditCardForm,
        addedCards: addedCards,
        basketModel: basketModel
    });
    return next();
});


/**
 * Remove Gift Payment for specific card no from checkout
 */
server.post('RemoveGiftCard', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }
    var paymentInstruments = currentBasket.getPaymentInstruments();
    var iterator = paymentInstruments.iterator();
    var cardNumber = req.form.cardNumber;
    Transaction.wrap(function () {
        while (iterator.hasNext()) {
            var paymentInstrument = iterator.next();
            if (paymentInstrument !== null && paymentInstrument.custom.eGiftCardNumber === cardNumber) {
                var transactionAmount = paymentInstrument.paymentTransaction.amount.value;
                currentBasket.custom.eGiftTotalAmount -= transactionAmount;

                currentBasket.removePaymentInstrument(paymentInstrument);
            }
        }
    });
    // Get Remaining GiftCard Payment
    var remainingCards = [];
    var updatedPaymentInstruments = currentBasket.getPaymentInstruments();
    if (updatedPaymentInstruments.length > 0) {
        for (var k = 0; k < updatedPaymentInstruments.length; k++) {
            var cardNo = updatedPaymentInstruments[k].custom.eGiftCardNumber;
            var cardValue = updatedPaymentInstruments[k].paymentTransaction.amount;
            if (cardNo !== null) {
                remainingCards.push({ cardNo: cardNo, amount:formatMoney(cardValue) });
            }
        }
    }
    var hideCreditCardForm = true;
    if (updatedPaymentInstruments.length === 0) {
        hideCreditCardForm = false;
    }
    var remainingAmount = currentBasket.totalGrossPrice.value - currentBasket.custom.eGiftTotalAmount;
    if (remainingAmount > 0 && currentBasket.custom.eGiftTotalAmount < currentBasket.totalGrossPrice.value) {
        hideCreditCardForm = false;
    }
    var CartModel = require('*/cartridge/models/cart');
    var basketModel = new CartModel(currentBasket);
    res.json({
        error: false,
        basketModel: basketModel,
        remainingCards: remainingCards,
        hideCreditCardForm: hideCreditCardForm,
        removeMessage: Resource.msg(
            'gift.cards.removed.success.message',
            'giftcards',
            null
        )
    });
    return next();
});

/**
 * Check Qwikcilver Gift Card Balance
 * Call Qwikcilver API
 * Handle Errors
 */
server.post('CheckBalance', function (req, res, next) {
    var qwikcilverApis = require('*/cartridge/scripts/service/qwikcilver/apis');
    var Site = require('dw/system/Site');
    var Currency = require('dw/util/Currency');
    var cardNumber = req.form.cardNo;
    var cardPin = req.form.cardPin;
    var verifyCaptchaHelper = require('*/cartridge/scripts/helpers/verifyCaptchaHelper');
    var isReCaptchaEnable = Site.getCurrent().getCustomPreferenceValue(
        'enableGoogleRecaptcha'
    );
    // TODO: Remove check once captcha done on checkout balance check
    var landingPage = req.httpParameterMap.get('landingPage').booleanValue;
    if (isReCaptchaEnable && landingPage) {
        var recaptchaResponse = req.httpParameterMap
            .get('g-recaptcha-response')
            .getStringValue();

        var pageScore = verifyCaptchaHelper.pageScore('checkBalance');
        var verifyCaptcha = verifyCaptchaHelper.verifyGoogleCaptcha(
            recaptchaResponse,
            pageScore
        );
        if (!verifyCaptcha) {
            res.json({
                error: true,
                msg: Resource.msg('error.message.recaptcha', 'common', null)
            });
            this.emit('route:Complete', req, res);
            return;
        }
    }
    if (cardNumber && cardPin) {
        var giftCardAPIResult = qwikcilverApis.validateGiftCard(cardNumber, cardPin);
        if (giftCardAPIResult && giftCardAPIResult.status === 'OK') {
            var giftCardAPIResultObj = JSON.parse(giftCardAPIResult.object);
            if (giftCardAPIResultObj.ResponseCode !== 0 && giftCardAPIResultObj.Cards && giftCardAPIResultObj.Cards.length > 0) {
                if (giftCardAPIResultObj.Cards[0].ResponseCode === 10638) {
                    res.json({
                        error: true,
                        errorMessage: Resource.msg('qwikcilver.invalid.gift.card', 'giftcards', null)
                    });
                } else if (giftCardAPIResultObj.Cards[0].ResponseCode === 10251) {
                    res.json({
                        error: true,
                        errorMessage: Resource.msg('card.already.redeemed', 'giftcards', null)
                    });
                } else {
                    res.json({
                        error: true,
                        errorMessage: giftCardAPIResultObj.Cards[0].ResponseMessage
                    });
                }
                return next();
            }
            if (giftCardAPIResultObj.Cards && giftCardAPIResultObj.Cards.length > 0) {
                res.json({
                    error: false,
                    cardBalance: Currency.getCurrency(Site.getCurrent().getCurrencyCode()).getSymbol()  + ' ' + giftCardAPIResultObj.Cards[0].Balance,
                    cardStatus: giftCardAPIResultObj.Cards[0].CardStatus
                });
                return next();
            }
        } else if (giftCardAPIResult && giftCardAPIResult.errorMessage) {
            if ('status' in giftCardAPIResult && giftCardAPIResult.getStatus().equals('SERVICE_UNAVAILABLE')) {
                res.json({
                    error: true,
                    errorMessage: Resource.msg('qwikcilver.service.unavailable', 'giftcards', null)
                });
            } else if (giftCardAPIResult.msg === 'Connection reset') {
                res.json({
                    error: true,
                    errorMessage: giftCardAPIResult.msg
                });
            } else {
                var errorMessageObj = JSON.parse(giftCardAPIResult.errorMessage);
                res.json({
                    error: true,
                    errorMessage: errorMessageObj.ResponseMessage
                });
                return next();
            }
        } else {
            res.json({
                error: true,
                errorMessage: Resource.msg('qwikcilver.service.unavailable', 'giftcards', null)
            });
        }
    } else {
        res.json({
            error: true,
            errorMessage: Resource.msg('enter.giftcard.and.pin', 'giftcards', null)
        });
        return next();
    }
    res.json();
    return next();
});

server.get('GiftcardVideoLandingPage', function (req, res, next) {
    var Encoding = require('dw/crypto/Encoding');
    var OrderMgr = require('dw/order/OrderMgr');
    var orderDataEncoded = req.querystring.video;
    var uuid = req.querystring.uuid;
    var orderData = Encoding.fromBase64(orderDataEncoded).toString();
    var order = OrderMgr.getOrder(orderData);
    var videoLink;
    var message;
    var sender;
    var recipient;
    collection.forEach(order.allProductLineItems, function (item) {
        if (item.UUID === uuid) {
            videoLink = item.custom.eGiftVideoLink;
            message = item.custom.eGiftMessage;
            sender = item.custom.eGiftSender;
            recipient = item.custom.eGiftReceiver;
        }
    });
    res.render('videoLanding', {
        video: videoLink,
        message: message,
        sender: sender,
        recipient: recipient
    });
    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
