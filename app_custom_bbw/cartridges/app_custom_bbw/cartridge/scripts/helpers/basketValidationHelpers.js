'use strict';

var base = module.superModule;
var ProductMgr = require('dw/catalog/ProductMgr');
var collections = require('*/cartridge/scripts/util/collections');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var StoreMgr = require('dw/catalog/StoreMgr');

/**
 * validates that the product line items exist, are online, and have available inventory.
 * @param {dw.order.Basket} basket - The current user's basket
 * @returns {Object} an error object
 */
function validateProducts(basket) {
    var result = {
        error: false,
        hasInventory: true
    };
    var productLineItems = basket.productLineItems;

    collections.forEach(productLineItems, function (item) {
        var apiProduct = ProductMgr.getProduct(item.productID);
        var productLevelReserveQty =
            'custom' in apiProduct &&
            'reserveQty' in apiProduct.custom &&
            apiProduct.custom.reserveQty
                ? apiProduct.custom.reserveQty
                : 0;
        var globalLevelReserveQty = dw.system.Site.getCurrent().getCustomPreferenceValue('reserveQty');
        var reserveOosQty = productLevelReserveQty || globalLevelReserveQty;

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
            var availabilityLevels = item.product.availabilityModel
                .getAvailabilityLevels(item.quantityValue + reserveOosQty);
            result.hasInventory = result.hasInventory
                && (availabilityLevels.notAvailable.value === 0) ;
        }
    });

    return result;
}

base.validateProducts = validateProducts;

module.exports = base;
