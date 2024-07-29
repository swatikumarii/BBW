'use strict';

var base = module.superModule;

var encryptionHelper = require('*/cartridge/scripts/helpers/encryptionHelpers');
var ProductFactory = require('*/cartridge/scripts/factories/product');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var Money = require('dw/value/Money');

/**
 * Returns Free shippung status
 * @param {dw.order.Basket} basket - Current users's basket
 * @returns {boolean}  - free shupping status
 */
function getFreeShippingStatus(basket) {
    var status=false;
    if (basket && basket.allShippingPriceAdjustments && basket.allShippingPriceAdjustments.length) {
        if (basket.allShippingPriceAdjustments[0].appliedDiscount && basket.allShippingPriceAdjustments[0].appliedDiscount.type === 'FREE'){
            status = true;
        }
    }
    return status;
}

/**
 * @param {string[]} pids - Product Ids
 * @returns {Array} Products
 */
function recommendedProducts(pids) {
    var products = [];
    if (pids && pids.length > 0) {
        for (var i = 0; i < pids.length; i++) {
            var productTileParams = { pview: 'tile', pid: pids[i] };

            var product;
            var productUrl;

            try {
                product = ProductFactory.get(productTileParams);
                productUrl = URLUtils.abs(
                    'Product-Show',
                    'pid',
                    product.id
                ).toString();
            } catch (e) {
                product = false;
                productUrl = URLUtils.abs('Home-Show');
            }
            var context = {
                product: product,
                urls: {
                    product: productUrl
                }
            };
            products.push(context);
        }
    }
    return products;
}

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {object} options - The current order's line items
 * @param {object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @class
 */
function OrderModel(lineItemContainer, options) {
    base.call(this, lineItemContainer, options);
    var trackingUrl = Site.getCurrent().getCustomPreferenceValue('trackingUrl');
    if (lineItemContainer) {
        var encrptedOrderNumber = encodeURIComponent( encryptionHelper.encryptPin(this.orderNumber));
        this.exportStatus = 'exportStatus' in lineItemContainer ? lineItemContainer.exportStatus : 0;
        this.invoiceDownloadUrl = URLUtils.https('Order-InvoiceDownload', 'token', encrptedOrderNumber).toString();
        this.trackingUrl = trackingUrl;
        this.trackOrderShippingUrl = '';        
        var currentSite = Site.getCurrent();
        var currency = new Money(0, currentSite.getDefaultCurrency());
        var currencyCode = currency.toFormattedString();
        currencyCode = (currencyCode || '').trim().split(' ')[0] || '';
        this.currencyCode = currencyCode.replace('0.00', '').replace('0,00', '');
        this.eGiftTotalAmount = 'eGiftTotalAmount' in lineItemContainer.custom && lineItemContainer.custom.eGiftTotalAmount ? lineItemContainer.custom.eGiftTotalAmount : 0;

        this.hasFreeShipping = getFreeShippingStatus(lineItemContainer);
        if (this.totals) {
            this.totals.hasFreeShipping = getFreeShippingStatus(lineItemContainer);
        }
        if (lineItemContainer.shipments && lineItemContainer.shipments.length > 0) {

            if (
                'carrier' in lineItemContainer.shipments[0].custom &&
                'trackingNumber' in lineItemContainer.shipments[0] &&
                lineItemContainer.shipments[0].trackingNumber
            ) {
                var commonHelpers = require('*/cartridge/scripts/helpers/commonHelpers');
                var trackOrderShippingUrl = commonHelpers.getTrackingUrl(
                    lineItemContainer.shipments[0].custom.carrier.toString().trim(),
                    lineItemContainer.shipments[0].trackingNumber.toString()
                );
                this.trackOrderShippingUrl = trackOrderShippingUrl;
            }

            this.shippingStatus = 'shippingStatus' in lineItemContainer.shipments[0] ? lineItemContainer.shipments[0].shippingStatus : '';
            this.trackingNumber = 'trackingNumber' in lineItemContainer.shipments[0] ? lineItemContainer.shipments[0].trackingNumber : '';
        }
        var emailRecommendationProducts = 'emailRecommendationPids' in lineItemContainer.custom && lineItemContainer.custom.emailRecommendationPids ? JSON.parse(lineItemContainer.custom.emailRecommendationPids) : null;
        var emailRecommendationProductDetails = {};
        if (emailRecommendationProducts) {
            emailRecommendationProductDetails.confirmationEmailRecommendationProducts =
                recommendedProducts(
                    emailRecommendationProducts.confirmationEmailRecommendationPIDs
                );
            emailRecommendationProductDetails.shipmentEmailRecommendationProducts =
                recommendedProducts(
                    emailRecommendationProducts.shipmentEmailRecommendationPIDs
                );
            emailRecommendationProductDetails.deliveryEmailRecommendationProducts =
                recommendedProducts(
                    emailRecommendationProducts.deliveryEmailRecommendationPIDs
                );
            emailRecommendationProductDetails.gcEmailRecommendationProducts =
                recommendedProducts(
                    emailRecommendationProducts.gcEmailRecommendationPIDs
                );
        }
        this.emailRecommendationProducts = emailRecommendationProductDetails;
    }
}

module.exports = OrderModel;
