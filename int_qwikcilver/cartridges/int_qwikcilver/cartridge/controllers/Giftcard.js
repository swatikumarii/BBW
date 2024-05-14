'use strict';

var server = require('server');

var ProductFactory = require('*/cartridge/scripts/factories/product');
var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
var URLUtils = require('dw/web/URLUtils');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');

server.get('Show', function (req, res, next) {
    var giftCardId = req.querystring.pid;
    var giftCard = ProductFactory.get({pid: giftCardId});
    var recepientForm = server.forms.getForm('recipients');
    var months = qwikcilverHelpers.getMonths();
    var days = qwikcilverHelpers.getNoOfDaysOfMonth();
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var removeLineItemURL = URLUtils.url('Giftcard-RemoveLineItems');

    res.render('giftcard/details', {
        giftCard: giftCard,
        recepientForm: recepientForm,
        months: months,
        days: days,
        addToCartUrl: addToCartUrl,
        removeLineItemURL: removeLineItemURL
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
    res.json();
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
                errorMessage: Resource.msgf('error.payment.for.gift.limit', 'eGiftCard', null, noOfGiftCardRedemption)
            });
            return next();
        }
        var isGiftProductAvailable = qwikcilverHelpers.validateGiftProduct(currentBasket);
        if (isGiftProductAvailable) {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.payment.for.gift.product', 'eGiftCard', null)
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
                noPendingAmount: Resource.msg('payment.no.pending.gift.amount', 'eGiftCard', null),
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
                        errorMessage: Resource.msg('payment.card.already.exist', 'eGiftCard', null),
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
            if (validateGiftCard.Cards[0].Balance < minRedemptionAmount) {
                res.json({
                    error: true,
                    cardNumber: cardNumber,
                    hideCreditCardForm: false,
                    errorMessage: 'Cannot Add gift card amount less than ' + currency + minRedemptionAmount
                });
                return next();
            }
            if (validateGiftCard.ResponseCode !== 0 && validateGiftCard.Cards && validateGiftCard.Cards[0].ResponseCode !== 0) {
                if (validateGiftCard.Cards[0].ResponseCode === 10638) {
                    res.json({
                        error: true,
                        cardNumber: cardNumber,
                        errorMessage: Resource.msg('qwikcilver.invalid.gift.card', 'eGiftCard', null)
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
                    if (cardNo !== null) {
                        addedCards.push(cardNo);
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
                    success: Resource.msg('qwikcilver.card.added', 'eGiftCard', null) + Resource.msgf('qwikcilver.card.pending', 'eGiftCard', null, currency, remainingAmount.toFixed(2)),
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
                    errorMessage: Resource.msg('qwikcilver.service.unavailable', 'eGiftCard', null)
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
                errorMessage: Resource.msg('qwikcilver.service.unavailable', 'eGiftCard', null)
            });
            return next();
        }
    } else {
        res.json({
            error: true,
            errorMessage: Resource.msg('enter.giftcard.and.pin', 'eGiftCard', null)
        });
        return next();
    }
    res.json({
        error: false,
        noPendingAmount: Resource.msg('payment.no.pending.gift.amount', 'eGiftCard', null),
        cardNumber: cardNumber,
        hideCreditCardForm: hideCreditCardForm,
        addedCards: addedCards,
        basketModel: basketModel
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
    var cardNumber = req.form.cardNo;
    var cardPin = req.form.cardPin;
    if (cardNumber && cardPin) {
        var giftCardAPIResult = qwikcilverApis.validateGiftCard(cardNumber, cardPin);
        if (giftCardAPIResult && giftCardAPIResult.status === 'OK') {
            var giftCardAPIResultObj = JSON.parse(giftCardAPIResult.object);
            if (giftCardAPIResultObj.ResponseCode !== 0 && giftCardAPIResultObj.Cards && giftCardAPIResultObj.Cards.length > 0) {
                if (giftCardAPIResultObj.Cards[0].ResponseCode === 10638) {
                    res.json({
                        error: true,
                        errorMessage: Resource.msg('qwikcilver.invalid.gift.card', 'eGiftCard', null)
                    });
                } else if (giftCardAPIResultObj.Cards[0].ResponseCode === 10251) {
                    res.json({
                        error: true,
                        errorMessage: Resource.msg('card.already.redeemed', 'eGiftCard', null)
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
                    cardBalance: giftCardAPIResultObj.Cards[0].Balance,
                    cardStatus: giftCardAPIResultObj.Cards[0].CardStatus
                });
                return next();
            }
        } else if (giftCardAPIResult && giftCardAPIResult.errorMessage) {
            if ('status' in giftCardAPIResult && giftCardAPIResult.getStatus().equals('SERVICE_UNAVAILABLE')) {
                res.json({
                    error: true,
                    errorMessage: Resource.msg('qwikcilver.service.unavailable', 'eGiftCard', null)
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
                errorMessage: Resource.msg('qwikcilver.service.unavailable', 'eGiftCard', null)
            });
        }
    } else {
        res.json({
            error: true,
            errorMessage: Resource.msg('enter.giftcard.and.pin', 'eGiftCard', null)
        });
        return next();
    }
    res.json();
    return next();
});

module.exports = server.exports();
