'use strict';

var base = module.superModule;
var ProductMgr = require('dw/catalog/ProductMgr');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var StoreMgr = require('dw/catalog/StoreMgr');
var Logger = require('dw/system/Logger');
var productValidationHelpers = require('*/cartridge/scripts/helpers/productValidationHelpers');
var collections = require('*/cartridge/scripts/util/collections');

/**
 * validates that the product line items exist, are online, and have available inventory.
 * @param {dw.order.Basket} basket - The current user's basket
 * @returns {object} an error object
 */
function validateProducts(basket) {
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var result = {
        error: false,
        hasInventory: true
    };
    var productLineItems = basket.productLineItems;
    collections.forEach(productLineItems, function (item) {
        var apiProduct = ProductMgr.getProduct(item.productID);
        var qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
            item.productID,
            productLineItems
        );
        var productLevelReserveQty =
            'custom' in apiProduct &&
            'reserveQty' in apiProduct.custom &&
            apiProduct.custom.reserveQty
                ? apiProduct.custom.reserveQty
                : 0;
        var globalLevelReserveQty = dw.system.Site.getCurrent().getCustomPreferenceValue('reserveQty');
        var reserveOosQty = productLevelReserveQty || globalLevelReserveQty;
        var maxOrderQty =
            productValidationHelpers.getProductMaxOrderQty(apiProduct);;
        if (item.product === null || !item.product.online) {
            result.error = true;
            return;
        }
        if (Object.hasOwnProperty.call(item.custom, 'fromStoreId')
            && item.custom.fromStoreId) {
            var store = StoreMgr.getStore(item.custom.fromStoreId);
            var storeInventory = ProductInventoryMgr.getInventoryList(store.custom.inventoryListId);
            result.hasInventory = result.hasInventory
                && (storeInventory.getRecord(item.productID)
                && storeInventory.getRecord(item.productID).ATS.value >= item.quantityValue);
        } else {
            try {
                var availabilityLevels =
                    item.product.availabilityModel.getAvailabilityLevels(
                        qtyAlreadyInCart + reserveOosQty
                    );
                result.hasInventory =
                    result.hasInventory &&
                    availabilityLevels.notAvailable.value === 0 &&
                    (maxOrderQty ? qtyAlreadyInCart <= maxOrderQty : true);
            } catch (error) {
                Logger.error(
                    'Inventory check failed for max order qty for product: ' + item.productID + ' '
                 + error);
            }
        }
    });

    return result;
}

/**
 * validates Pricing
 * @param {object} basket current basket
 * @returns {object} result
 */
function validatePricing(basket) {
    var result = {
        error: false
    };
    collections.forEach(basket.productLineItems, function (item) {
        if (item.basePrice.value === 0) {
            result.error = true;
        }
    });
    return result;
}

base.validateProducts = validateProducts;
base.validatePricing = validatePricing;

module.exports = base;
