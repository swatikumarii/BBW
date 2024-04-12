/**
 * File Name          : giftWrap.js
 * Description        : giftWrapHelpers
 * Ver          Modification
 * 1.0          Common functions
 */

'use strict';

var site = require('dw/system/Site');
var productMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var constants = require('*/cartridge/config/constants.js');
var productHelpers = require('*/cartridge/scripts/helpers/product');
var customPreferenceNames = require('*/cartridge/config/customPreferenceNames');

/**
 * @param {dw.order.Basket} currentBasket - Current Basket
 * @param {string} pid - product id
 */
function removeGiftWrapLineItem(currentBasket, pid) {
    var giftWrapCategoryName = site.current.getCustomPreferenceValue(
        customPreferenceNames.giftWrapCategoryName
    );
    var giftWrapProductLineItem = productHelpers.getProductLineItemByCategory(
        currentBasket.getAllProductLineItems(),
        giftWrapCategoryName
    );
    if (giftWrapProductLineItem) {
        var product = productMgr.getProduct(pid);
        var isGiftWrapProduct = productHelpers.isCategoryMatches(
            product,
            giftWrapCategoryName
        );
        if (isGiftWrapProduct) {
            // If removed product is GiftWrapCategoryProduct than reset gift wrap attribute
            Transaction.wrap(function () {
                // RemoveProductLineItem
                currentBasket.removeProductLineItem(giftWrapProductLineItem);
            });
        }
    }
}

/**
 * Get product id indexed array with value its occurance
 * @param {string[]} productIds - Product Ids array
 * @returns {string[]} - Where index will be productId and value will be occurance
 */
function getProductCountArray(productIds) {
    var pids = [];
    for (var j = 0; j < productIds.length; j++) {
        if (pids[productIds[j]]) {
            pids[productIds[j]] += 1;
        } else {
            pids[productIds[j]] = 1;
        }
    }
    return pids;
}

/**
 * @param {dw.order.ProductLineItem[]} productLineItems - Product Line Item Array
 * @param {string[]} productIds - Product Ids array
 * @param {string} giftWrapProductId - Gift wrap product Id
 */
function updateProductLineItemForIndividual(
    productLineItems,
    productIds,
    giftWrapProductId
) {
    var pids = getProductCountArray(productIds);
    Transaction.wrap(function () {
        for (var i = 0; i < productLineItems.length; i++) {
            var pli = productLineItems[i];
            if (pli.productID !== giftWrapProductId) {
                if (pli.product.custom.isGiftWrappable && pids[pli.productID]) {
                    pli.custom.isWrapped = true;
                    pli.custom.wrappedQuantity = pids[pli.productID];
                } else {
                    pli.custom.isWrapped = false;
                    pli.custom.wrappedQuantity = 0;
                }
            }
        }
    });
}

/**
 * 
 * @param {dw.order.ProductLineItem[]} productLineItems - Product Line Item Array
 * @param {string} giftWrapProductId - Gift wrap product Id
 */
function updateProductLineItemForTogether(productLineItems, giftWrapProductId) {
    Transaction.wrap(function () {
        for (var i = 0; i < productLineItems.length; i++) {
            var pli = productLineItems[i];
            if (
                pli.product.custom.isGiftWrappable &&
                pli.productID !== giftWrapProductId
            ) {
                pli.custom.isWrapped = true;
                pli.custom.wrappedQuantity = 0;
            }
        }
    });
}

/**
 * @param {dw.util.Collection<dw.order.ProductLineItem>} allProductLineItems - All product Line Items of current basket
 * @param {string} pid - Product Id
 * @param {string} giftWrapType - Gift wrap type
 * @param {string[]} wrappingProductIds - Wrapping product ids
 */
function updateWrapForAllProductLineItem(
    allProductLineItems,
    pid,
    giftWrapType,
    wrappingProductIds
) {
    var giftWrapCategoryName = site.current.getCustomPreferenceValue(
        customPreferenceNames.giftWrapCategoryName
    );
    var giftWrapProductLineItem = productHelpers.getProductLineItemByCategory(
        allProductLineItems,
        giftWrapCategoryName
    );

    if (giftWrapProductLineItem && giftWrapProductLineItem.product.ID === pid) {
        var productLineItems = allProductLineItems.toArray();
        if (giftWrapType === constants.WRAP_INDIVIDUAL_VALUE) {
            if (wrappingProductIds) {
                updateProductLineItemForIndividual(
                    productLineItems,
                    wrappingProductIds,
                    pid
                );
            }
        } else if (giftWrapType === constants.WRAP_TOGETHER_VALUE) {
            updateProductLineItemForTogether(productLineItems, pid);
        }
    }
}

module.exports = {
    removeGiftWrapLineItem: removeGiftWrapLineItem,
    updateWrapForAllProductLineItem: updateWrapForAllProductLineItem
};
