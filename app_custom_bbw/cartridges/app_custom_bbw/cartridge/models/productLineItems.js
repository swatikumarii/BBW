'use strict';

var base = module.superModule;

var collections = require('*/cartridge/scripts/util/collections');
var ProductFactory = require('*/cartridge/scripts/factories/product');
var ProductMgr = require('dw/catalog/ProductMgr');
var productDetailForAddToCart = require('*/cartridge/models/product/productDetailForAddToCart');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');


/**
 * Get Egift Card Details
 * @param {object} item - line item
 * @returns {object} giftCardDetails
 */
function getEgiftCardDetails(item) {
    // Set Card Details
    var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
    var eGiftScheduledMonths = item.custom.eGiftCardScheduleMonth;
    var eGiftScheduledYear = item.custom.eGiftScheduledYear;
    var eGiftScheduledDay = item.custom.eGiftCardScheduleDay;
    var eGiftVideoLink = item.custom.eGiftVideoLink;
    var eGiftScheduledDate;
    var month = qwikcilverHelpers.getIndexOfMonths(eGiftScheduledMonths);
    if (eGiftScheduledMonths && eGiftScheduledYear && eGiftScheduledDay) {
        eGiftScheduledDate = month + '-' + eGiftScheduledDay + '-' + eGiftScheduledYear;
    }
    var giftCardBarCode = '';
    var giftBarCodeNumber = '';
    if (item.custom.eGiftCardBarcode) {
        var Site = require('dw/system/Site');
        var eGiftBarCodeUrl = Site.current.getCustomPreferenceValue(
            'qwikcilverEGiftBarCodeUrl'
        );
        giftCardBarCode = eGiftBarCodeUrl + item.custom.eGiftCardBarcode;
        giftBarCodeNumber = item.custom.eGiftCardBarcode;
    }

    var cardInfo = {
        cardNumber: item.custom.eGiftCardNumber || '',
        cardPin: item.custom.eGiftCardPin
            ? qwikcilverHelpers.decodeFromBase64(item.custom.eGiftCardPin)
            : '',
        cardExpiryDate: item.custom.eGiftCardExpiry
            ? item.custom.eGiftCardExpiry.substring(10, 0)
            : '',
        // cardStatus: item.custom.cardStatus || '',
        recipientEmail: item.custom.eGiftReceiverEmail || '',
        eGiftMessage: item.custom.eGiftMessage || '',
        recipientName: item.custom.eGiftReceiver || '',
        senderName: item.custom.eGiftSender || '',
        isEgiftProduct: item.custom.isEgiftCard || false,
        eGiftScheduledDate: eGiftScheduledDate || '',
        eGiftEmailPending: item.custom.eGiftEmailPending || false,
        eGiftScheduledDay: eGiftScheduledDay || '',
        eGiftScheduledMonths: eGiftScheduledMonths || '',
        giftBarCode: giftCardBarCode,
        giftBarCodeNumber: giftBarCodeNumber,
        eGiftVideoLink: eGiftVideoLink || ''
    };
    return cardInfo;
}

/**
 * Creates an array of product line items
 * @param {dw.util.Collection<dw.order.ProductLineItem>} allLineItems - All product
 * line items of the basket
 * @param {string} view - the view of the line item (basket or order)
 * @returns {Array} an array of product line items.
 */
function createProductLineItemsObject(allLineItems, view) {
    var Site = require('dw/system/Site');
    var lineItems = [];
    var enableQCeGift = Site.current.getCustomPreferenceValue('enableQwikcilver');

    collections.forEach(allLineItems, function (item) {
        var product = Object.create(null);
        var apiProduct = ProductMgr.getProduct(item.productID);
        if (!empty(apiProduct)) {
            var productType = productHelper.getProductType(apiProduct);
            product = productDetailForAddToCart(product, apiProduct, productType);
        }

        // when item's category is unassigned, return a lineItem with limited attributes
        if (!item.product) {
            lineItems.push({
                id: item.productID,
                quantity: item.quantity.value,
                productName: item.productName,
                priceTotal: 'adjustedPrice' in item ? item.adjustedPrice : '',
                basePrice: 'basePrice' in item ? item.basePrice : '',
                titlePartB: item.product && 'titlePartB' in item.product.custom ? item.product.custom.titlePartB : '',
                UUID: item.UUID,
                noProduct: true,
                images: {
                    small: [
                        {
                            url: URLUtils.staticURL('/images/noimagelarge.png'),
                            alt: Resource.msgf('msg.no.image', 'common', null),
                            title: Resource.msgf('msg.no.image', 'common', null)
                        }
                    ]
                }
            });
            return;
        }
        var options = collections.map(
            item.optionProductLineItems,
            function (optionItem) {
                return {
                    optionId: optionItem.optionID,
                    selectedValueId: optionItem.optionValueID
                };
            }
        );

        var bonusProducts = null;

        if (
            !item.bonusProductLineItem &&
            item.custom.bonusProductLineItemUUID &&
            item.custom.preOrderUUID
        ) {
            bonusProducts = [];
            collections.forEach(allLineItems, function (bonusItem) {
                if (
                    !!item.custom.preOrderUUID &&
                    bonusItem.custom.bonusProductLineItemUUID ===
                        item.custom.preOrderUUID
                ) {
                    var bpliOptions = collections.map(
                        bonusItem.optionProductLineItems,
                        function (boptionItem) {
                            return {
                                optionId: boptionItem.optionID,
                                selectedValueId: boptionItem.optionValueID
                            };
                        }
                    );
                    var params = {
                        pid: bonusItem.product.ID,
                        quantity: bonusItem.quantity.value,
                        variables: null,
                        pview: 'bonusProductLineItem',
                        containerView: view,
                        lineItem: bonusItem,
                        options: bpliOptions
                    };

                    bonusProducts.push(ProductFactory.get(params));
                }
            });
        }

        var params = {
            pid: item.product.ID,
            quantity: item.quantity.value,
            variables: null,
            pview: 'productLineItem',
            containerView: view,
            lineItem: item,
            options: options
        };
        var newLineItem = ProductFactory.get(params);
        if ('titlePartB' in item.product.custom && item.product.custom.titlePartB) {
            newLineItem.titlePartB = item.product.custom.titlePartB;
        }
        if ('volume' in item.product.custom && item.product.custom.volume) {
            newLineItem.volume = item.product.custom.volume;
        }
        newLineItem.basePrice = 'basePrice' in item ? item.basePrice : '';

        if ('greetingCardMessage' in item.custom && item.custom.greetingCardMessage) {
            newLineItem.greetingCardMessage = item.custom.greetingCardMessage;
        }

        newLineItem.bonusProducts = bonusProducts;
        if (enableQCeGift && 'custom' in item && 'isEgiftCard' in item.custom && item.custom.isEgiftCard) {
            newLineItem.giftCardDetails = getEgiftCardDetails(item);
            newLineItem.isEgiftCard = true;
        }
        if (
            'custom' in item &&
            'customBundle' in item.custom &&
            item.custom.customBundle
        ) {
            newLineItem.customBundle = item.custom.customBundle;
        } else {
            newLineItem.customBundle = null;
        }
        if (
            newLineItem.bonusProductLineItemUUID === 'bonus' ||
            !newLineItem.bonusProductLineItemUUID
        ) {
            if (newLineItem.isGreetingCardCategory) {
                if ('greetingCardMessage' in item.custom) {
                    newLineItem.greetingCardMessage =
                        item.custom.greetingCardMessage;
                }
            } else if ('isWrapped' in item.custom && 'wrappedQuantity' in item.custom) {
                newLineItem.wrap = {
                    isWrapped: item.custom.isWrapped,
                    wrappedQuantity: item.custom.wrappedQuantity
                };
            }
            lineItems.push(newLineItem);
        }
        if (!('available' in newLineItem)){
            newLineItem.available = 'available' in product ? product.available : false;
        }
        if (!('fragranceName' in newLineItem)){
            newLineItem.fragranceName = 'fragranceName' in product && product.fragranceName !== '' ? product.fragranceName : false;
        }
        if(!('isEgiftCard' in newLineItem)){
            if (!empty(apiProduct) && 'custom' in apiProduct && 'isEgiftCard' in apiProduct.custom && apiProduct.custom.isEgiftCard) {
                newLineItem.isEgiftCard = apiProduct.custom.isEgiftCard;
            } else {
                newLineItem.isEgiftCard = false;
            }
        }
        newLineItem.enableNotifyMe = product.enableNotifyMe;
    });
    return lineItems;
}

/**
 * @classdesc class that represents a collection of line items and total quantity of
 * items in current basket or per shipment
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - the product line items
 *                                                       of the current line item container
 * @param {string} view - the view of the line item (basket or order)
 */
function ProductLineItems(productLineItems, view) {
    if (productLineItems) {
        this.items = createProductLineItemsObject(productLineItems, view);
        this.totalQuantity = base.getTotalQuantity(productLineItems);
    } else {
        this.items = [];
        this.totalQuantity = 0;
    }
}

ProductLineItems.getTotalQuantity = base.getTotalQuantity;

module.exports = ProductLineItems;
