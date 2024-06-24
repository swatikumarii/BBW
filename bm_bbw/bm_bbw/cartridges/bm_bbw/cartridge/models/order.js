'use strict';

// var Resource = require('dw/web/Resource');

var AddressModel = require('*/cartridge/models/address');
var BillingModel = require('*/cartridge/models/billing');
var PaymentModel = require('*/cartridge/models/payment');
var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
var TotalsModel = require('*/cartridge/models/totals');

var ShippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');

// var encryptionHelper = require("*/cartridge/scripts/helpers/encryptionHelpers");
var URLUtils = require("dw/web/URLUtils");
var Site = require("dw/system/Site");
var Money = require("dw/value/Money");

var DEFAULT_MODEL_CONFIG = {
    numberOfLineItems: '*'
};

/**
 * Returns Free shippung status
 * @param {dw.order.Basket} basket - Current users's basket
 * @returns {boolean}  - free shupping status
 */
function getFreeShippingStatus(basket) {
  var status = false;
  if (
    basket &&
    basket.allShippingPriceAdjustments &&
    basket.allShippingPriceAdjustments.length
  ) {
    if (
      basket.allShippingPriceAdjustments[0].appliedDiscount &&
      basket.allShippingPriceAdjustments[0].appliedDiscount.type === "FREE"
    ) {
      status = true;
    }
  }
  return status;
}

/**
 * Returns the first productLineItem from a collection of productLineItems.
 * @param {Object} productLineItemsModel - line items model
 * @return {Object} returns an object with image properties
*/
function getFirstProductLineItem(productLineItemsModel) {
    if (productLineItemsModel && productLineItemsModel.items[0]) {
        var firstItemImage = productLineItemsModel.items[0].images.small[0];
        return {
            imageURL: firstItemImage.url,
            alt: firstItemImage.alt,
            title: firstItemImage.title
        };
    }
    return null;
}

/**
 * Returns the matching address ID or UUID for a billing address
 * @param {dw.order.Basket} basket - line items model
 * @param {Object} customer - customer model
 * @return {string|boolean} returns matching ID or false
*/
function getAssociatedAddress(basket, customer) {
    var address = basket.billingAddress;
    var matchingId;
    var anAddress;

    if (!address) return false;

    // First loop through all shipping addresses
    for (var i = 0, ii = basket.shipments.length; i < ii; i++) {
        anAddress = basket.shipments[i].shippingAddress;

        if (anAddress && anAddress.isEquivalentAddress(address)) {
            matchingId = basket.shipments[i].UUID;
            break;
        }
    }

    // If we still haven't found a match, then loop through customer addresses to find a match
    if (!matchingId && customer && customer.addressBook && customer.addressBook.addresses) {
        for (var j = 0, jj = customer.addressBook.addresses.length; j < jj; j++) {
            anAddress = customer.addressBook.addresses[j];

            if (anAddress && anAddress.isEquivalentAddress(address)) {
                matchingId = anAddress.ID;
                break;
            }
        }
    }

    return matchingId;
}

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @constructor
 */
function OrderModel(lineItemContainer, options) {

    var trackingUrl = Site.getCurrent().getCustomPreferenceValue("trackingUrl");
    if (!lineItemContainer) {
        this.orderNumber = null;
        this.creationDate = null;
        this.orderEmail = null;
        return {};
    } else {
        var safeOptions = options || {};
        var countryCode = safeOptions.countryCode || null;
        var modelConfig = safeOptions.config || DEFAULT_MODEL_CONFIG;
        var customer = safeOptions.customer || lineItemContainer.customer;
        // var usingMultiShipping = (safeOptions.usingMultiShipping
        //     || lineItemContainer.shipments.length > 1);

        var currentSite = Site.getCurrent();
        var currency = new Money(0, currentSite.getDefaultCurrency());
        var currencyCode = currency.toFormattedString();
        this.currencyCode = (currencyCode || "").trim().split(" ")[0] || "";
        var shippingModels = ShippingHelpers.getShippingModels(lineItemContainer, customer, safeOptions.containerView, safeOptions);

        var paymentModel = new PaymentModel(lineItemContainer, customer, countryCode);

        var billingAddressModel = new AddressModel(lineItemContainer.billingAddress);

        // var associatedAddress = getAssociatedAddress(lineItemContainer, customer);

        var billingModel = new BillingModel(
          billingAddressModel,
          paymentModel /*, associatedAddress*/,
          //   null,
          null
        );

        var productLineItemsModel = new ProductLineItemsModel(lineItemContainer.productLineItems, options.containerView ? options.containerView : null);
        var totalsModel = new TotalsModel(lineItemContainer);

        // this.shippable = safeOptions.shippable || false;
        // this.usingMultiShipping = usingMultiShipping;
        this.orderNumber = Object.hasOwnProperty.call(lineItemContainer, 'orderNo')
            ? lineItemContainer.orderNo
            : null;
        this.priceTotal = totalsModel ? totalsModel.grandTotal
            : null;
        this.creationDate = Object.hasOwnProperty.call(lineItemContainer, 'creationDate')
            ? lineItemContainer.creationDate
            : null;
        this.orderEmail = lineItemContainer.customerEmail;
        // this.orderStatus = Object.hasOwnProperty.call(lineItemContainer, 'status')
        //     ? lineItemContainer.status
        //     : null;
        // this.productQuantityTotal = lineItemContainer.productQuantityTotal
        //     ? lineItemContainer.productQuantityTotal : null;

        if (modelConfig.numberOfLineItems === '*') {
           this.totals = totalsModel;
        //     this.lineItemTotal = productLineItemsModel ? productLineItemsModel.length : null;
           this.items = productLineItemsModel;//TODO:
        //  this.billingAddress = billingAddressModel;
            this.billing = billingModel;
            this.shipping = shippingModels;
        }
        //  else if (modelConfig.numberOfLineItems === 'single'
        //         && shippingModels[0].shippingAddress) {
        //     this.firstLineItem = getFirstProductLineItem(productLineItemsModel);
        //     this.shippedToFirstName = shippingModels[0].shippingAddress.firstName || '';
        //     this.shippedToLastName = shippingModels[0].shippingAddress.lastName || '';
        // }
        // this.exportStatus = 'exportStatus' in lineItemContainer ? lineItemContainer.exportStatus : 0;
        this.trackingUrl = trackingUrl;
        // var currentSite = Site.getCurrent();
        // var currency = new Money(0, currentSite.getDefaultCurrency());
        // var currencyCode = currency.toFormattedString();
        // this.currencyCode = (currencyCode || '').trim().split(' ')[0] || '';

        this.hasFreeShipping = getFreeShippingStatus(lineItemContainer);
        if (this.totals) {
            this.totals.hasFreeShipping = getFreeShippingStatus(lineItemContainer);
        }
        if (lineItemContainer.shipments && lineItemContainer.shipments.length > 0) {
        //     this.shippingStatus = 'shippingStatus' in lineItemContainer.shipments[0] ? lineItemContainer.shipments[0].shippingStatus : '';
            this.trackingNumber = 'trackingNumber' in lineItemContainer.shipments[0] ? lineItemContainer.shipments[0].trackingNumber : '';
        }
        return {
          orderNumber: this.orderNumber,
          creationDate: this.creationDate,
          orderEmail: this.orderEmail,
          billing: this.billing,
          shipping: this.shipping,
          trackingUrl: this.trackingUrl,
          hasFreeShipping: this.hasFreeShipping,
          totals: this.totals,
          trackingNumber: this.trackingNumber,
          priceTotal: this.priceTotal,
          items: this.items,
          currencyCode: this.currencyCode,
          orderStatusURL: URLUtils.abs('Order-Status'),
          orderDetailsURL: URLUtils.abs('Order-Details', 'orderID', this.orderNumber, 'orderFilter', ''),
          orderHistoryURL: URLUtils.abs('Order-History')
        };
    }
}


// module.exports = OrderModel;

OrderModel.public = true;

exports.OrderModel = OrderModel;
