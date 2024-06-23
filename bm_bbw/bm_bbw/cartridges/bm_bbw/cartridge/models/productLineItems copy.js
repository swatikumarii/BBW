'use strict';

var base = module.superModule;

var collections = require('*/cartridge/scripts/util/collections');
// var ProductFactory = require('*/cartridge/scripts/factories/product');
var ProductMgr = require('dw/catalog/ProductMgr');
// var productDetailForAddToCart = require('*/cartridge/models/product/productDetailForAddToCart');
// var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
// var URLUtils = require('dw/web/URLUtils');
// var Resource = require('dw/web/Resource');

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
 * Return type of the current product
 * @param  {dw.catalog.ProductVariationModel} product - Current product
 * @return {string} type of the current product
 */
function getProductType(product) {
    var result;
    if (product.master) {
        result = 'master';
    } else if (product.variant) {
        result = 'variant';
    } else if (product.variationGroup) {
        result = 'variationGroup';
    } else if (product.productSet) {
        result = 'set';
    } else if (product.bundle) {
        result = 'bundle';
    } else if (product.optionProduct) {
        result = 'optionProduct';
    } else {
        result = 'standard';
    }
    return result;
}

/**
 * get the total price for the product line item
 * @param {dw.order.ProductLineItem} lineItem - API ProductLineItem instance
 * @returns {object} an object containing the product line item total info.
 */
function getTotalPrice(lineItem) {//priceTotal
    var context;
    var price;
    var result = {};

    if (lineItem.priceAdjustments.getLength() > 0) {
        result.nonAdjustedPrice = formatMoney(lineItem.getPrice());
    }

    price = lineItem.adjustedPrice;

    // The platform does not include prices for selected option values in a line item product's
    // price by default.  So, we must add the option price to get the correct line item total price.
    collections.forEach(lineItem.optionProductLineItems, function (item) {
        price = price.add(item.adjustedPrice);
    });

    result.price = formatMoney(price);
    result.priceValue = price.value;
    context = { lineItem: { priceTotal: result } };

    result.priceValue = price.value;
    return result;
}


/**
 * 
 * 1 price(product, apiProduct, options.promotions, false, options.optionModel);
 * 2 priceFactory.getPrice(product, null, useSimplePrice, promotions, currentOptions)
 * 
 * Retrieves Price instance
 *
 * @param {dw.catalog.Product|dw.catalog.productSearchHit} inputProduct - API object for a product
 * @param {string} currency - Current session currencyCode
 * @param {boolean} useSimplePrice - Flag as to whether a simple price should be used, used for
 *     product tiles and cart line items.
 * @param {dw.util.Collection<dw.campaign.Promotion>} promotions - Promotions that apply to this
 *                                                                 product
 * @param {dw.catalog.ProductOptionModel} currentOptionModel - The product's option model
 * @return {TieredPrice|RangePrice|DefaultPrice} - The product's price
 */
function getPrice(inputProduct, currency, useSimplePrice, promotions, currentOptionModel) {
    var rangePrice;
    var salesPrice;
    var listPrice;
    var product = inputProduct;
    var promotionPrice = money.NOT_AVAILABLE;
    var priceModel = currentOptionModel
        ? product.getPriceModel(currentOptionModel)
        : product.getPriceModel();
    var priceTable = priceModel.getPriceTable();

    // TIERED
    if (priceTable.quantities.length > 1) {
        return new TieredPrice(priceTable, useSimplePrice);
    }

    // RANGE
    if ((product.master || product.variationGroup) && priceModel.priceRange) {
        rangePrice = new RangePrice(priceModel.minPrice, priceModel.maxPrice);

        if (rangePrice && rangePrice.min.sales.value !== rangePrice.max.sales.value) {
            return rangePrice;
        }
    }

    // DEFAULT
    if ((product.master || product.variationGroup) && product.variationModel.variants.length > 0) {
        product = product.variationModel.variants[0];
        priceModel = product.priceModel;
    }

    promotionPrice = priceHelper.getPromotionPrice(product, promotions, currentOptionModel);
    listPrice = getListPrice(priceModel);
    salesPrice = priceModel.price;

    if (promotionPrice && promotionPrice.available && salesPrice.compareTo(promotionPrice)) {
        salesPrice = promotionPrice;
    }

    if (salesPrice && listPrice && salesPrice.value === listPrice.value) {
        listPrice = null;
    }

    if (salesPrice.valueOrNull === null && (listPrice && listPrice.valueOrNull !== null)) {
        salesPrice = listPrice;
        listPrice = {};
    }
    return new DefaultPrice(salesPrice, listPrice);
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
    var giftWrapLineItem = null;
    var greetingCardLineItem = null;
    var enableQCeGift = Site.current.getCustomPreferenceValue('enableQwikcilver');

    collections.forEach(allLineItems, function (item) {
        // var product = Object.create(null);
        var apiProduct = ProductMgr.getProduct(item.productID);
        // if (!empty(apiProduct)) {
        //     var productType = getProductType(apiProduct);
        //     product = productDetailForAddToCart(product, apiProduct, productType);
        // }

        // // when item's category is unassigned, return a lineItem with limited attributes
        // if (!item.product) {
        //     lineItems.push({
        //         id: item.productID,
        //         quantity: item.quantity.value,
        //         productName: item.productName,
        //         priceTotal: 'adjustedPrice' in item ? item.adjustedPrice : '',
        //         basePrice: 'basePrice' in item ? item.basePrice : '',
        //         titlePartB: item.product && 'titlePartB' in item.product.custom ? item.product.custom.titlePartB : '',
        //         UUID: item.UUID,
        //         noProduct: true,
        //         images: {
        //             small: [
        //                 {
        //                     url: URLUtils.staticURL('/images/noimagelarge.png'),
        //                     alt: Resource.msgf('msg.no.image', 'common', null),
        //                     title: Resource.msgf('msg.no.image', 'common', null)
        //                 }
        //             ]
        //         }
        //     });
        //     return;
        // }
        // var options = collections.map(
        //     item.optionProductLineItems,
        //     function (optionItem) {
        //         return {
        //             optionId: optionItem.optionID,
        //             selectedValueId: optionItem.optionValueID
        //         };
        //     }
        // );

        // var bonusProducts = null;

        // if (
        //     !item.bonusProductLineItem &&
        //     item.custom.bonusProductLineItemUUID &&
        //     item.custom.preOrderUUID
        // ) {
        //     bonusProducts = [];
        //     collections.forEach(allLineItems, function (bonusItem) {
        //         if (
        //             !!item.custom.preOrderUUID &&
        //             bonusItem.custom.bonusProductLineItemUUID ===
        //                 item.custom.preOrderUUID
        //         ) {
        //             var bpliOptions = collections.map(
        //                 bonusItem.optionProductLineItems,
        //                 function (boptionItem) {
        //                     return {
        //                         optionId: boptionItem.optionID,
        //                         selectedValueId: boptionItem.optionValueID
        //                     };
        //                 }
        //             );
        //             var params = {
        //                 pid: bonusItem.product.ID,
        //                 quantity: bonusItem.quantity.value,
        //                 variables: null,
        //                 pview: 'bonusProductLineItem',
        //                 containerView: view,
        //                 lineItem: bonusItem,
        //                 options: bpliOptions
        //             };

        //             bonusProducts.push(ProductFactory.get(params));
        //         }
        //     });
        // }

        var params = {
            pid: item.product.ID,
            quantity: item.quantity.value,
            variables: null,
            pview: 'productLineItem',
            containerView: view,
            lineItem: item,
            options: options
        };


        var greetingCardMessage = null;
        if ('greetingCardMessage' in item.custom && item.custom.greetingCardMessage) {
            greetingCardMessage = item.custom.greetingCardMessage;
        }
        var product = {
            id: apiProduct.ID,
            // ${lineItem.ispersonalizedGiftcard}
            // ${lineItem.personalizeGiftcardImage}
            // ${lineItem.alt}
            // ${lineItem.images.small[0].absURL}
            // ${lineItem.images.small[0].alt}
            // ${lineItem.images.small[0].title}
            fragranceName: 'custom' in apiProduct &&
                'fragranceName' in apiProduct.custom &&
                apiProduct.custom.fragranceName !== ''
                    ? apiProduct.custom.fragranceName
                    : false,
            productName : apiProduct.name,
            titlePartB: 'custom' in apiProduct &&
            'titlePartB' in apiProduct.custom &&
            apiProduct.custom.titlePartB !== ''
                ? apiProduct.custom.titlePartB
                : false,
            volume : 
            'custom' in apiProduct &&
            'volume' in apiProduct.custom &&
            apiProduct.custom.volume !== ''
                ? apiProduct.custom.volume
                : false,
            // ${lineItem.productCategory}
            greetingCardMessage :greetingCardMessage,

            // ${'giftCardDetails' in lineItem && lineItem.giftCardDetails && lineItem.giftCardDetails.isEgiftProduct}
            // ${lineItem.giftCardDetails.recipientEmail}
            // ${lineItem.quantity}
            // ${lineItem.noProduct}
            // ${lineItem.UUID}
            // ${lineItem.basePrice.currencyCode}
            // ${lineItem.basePrice.value}
            // ${'priceValue' in lineItem.priceTotal && lineItem.priceTotal.priceValue <= 0}
            // ${lineItem.price.sales.formatted}
            // ${lineItem.priceTotal.currencyCode}
            // ${lineItem.priceTotal.value}
            // ${'priceValue' in lineItem.priceTotal && lineItem.priceTotal.priceValue <= 0}
            // ${lineItem.priceTotal.price}
        };
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
        // var allLineItems = createProductLineItemsObject(productLineItems, view);
        return {
            items: createProductLineItemsObject(productLineItems, view)
        }
    } else {
        return {
          items: []
        };
    }
}

module.exports = ProductLineItems;
