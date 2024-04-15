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
var giftWrapHelpers = require('*/cartridge/scripts/helpers/giftWrap');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var customPreferenceNames = require('*/cartridge/config/customPreferenceNames');

/**
 * @param {dw.order.Basket} currentBasket - Current Basket
 * @returns {dw.order.ProductLineItem} productLineItem
 */
function getGiftWrapLineItem(currentBasket) {
    return productHelpers.getProductLineItemByCategory(
        currentBasket.getAllProductLineItems(),
        site.current.getCustomPreferenceValue(
            customPreferenceNames.giftWrapCategoryName
        )
    );
}

/**
 *
 * @param {*} items - Product line items
 * @returns {JSON} - Gift wrap config
 */
function getGiftWrapConfig(items) {
    var isGiftWrapEnable = site.current.getCustomPreferenceValue(
        customPreferenceNames.isGiftWrapEnable
    );
    if (isGiftWrapEnable) {
        var wrappableProducts = [];
        var wrappedProductCount = 0;
        var wrappedProductQuantity = [];
        items.forEach(function (element) {
            if (element.isGiftWrappable) {
                wrappableProducts.push(element);
                if (element.wrap.isWrapped) {
                    wrappedProductCount++;
                    wrappedProductQuantity.push(element.wrap.wrappedQuantity);
                }
            }
        });
        if (wrappableProducts.length === 0) {
            isGiftWrapEnable = false;
        } else {
            var wrapItemMethod = site.current.getCustomPreferenceValue(
                customPreferenceNames.wrapItemMethod
            ).value;
            var giftWrapProducts = productHelpers.getFullOnlineProducts(
                customPreferenceNames.giftWrapCategoryName
            );
            var isDisableTogetherOption =
                items.length !== wrappableProducts.length;
            var isDisableIndividualOption =
                items.length === 1 && items[0].quantity === 1;
            var wrapType = giftWrapHelpers.getWrapType(
                wrappableProducts,
                wrappedProductCount,
                wrappedProductQuantity
            );
            return {
                isGiftWrapEnable: isGiftWrapEnable,
                wrapItemMethod: wrapItemMethod,
                giftWrapProducts: giftWrapProducts,
                isDisableTogetherOption: isDisableTogetherOption,
                isDisableIndividualOption: isDisableIndividualOption,
                wrappableProducts: wrappableProducts,
                wrapType: wrapType
            };
        }
    }
    return { isGiftWrapEnable: isGiftWrapEnable };
}

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
    var prodtIdArray = JSON.parse(productIds);
    for (var j = 0; j < prodtIdArray.length; j++) {
        if (pids[prodtIdArray[j]]) {
            pids[prodtIdArray[j]] += 1;
        } else {
            pids[prodtIdArray[j]] = 1;
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

/**
 * @param {dw.order.Basket} currentBasket - Current Basket
 * @param {string} pid - product id
 */
function handleRemoveProduct(currentBasket, pid) {
    var giftWrapCategoryName = site.current.getCustomPreferenceValue(
        customPreferenceNames.giftWrapCategoryName
    );
    var giftWrapProductLineItem = productHelpers.getProductLineItemByCategory(
        currentBasket.getAllProductLineItems(),
        giftWrapCategoryName
    );
    if (giftWrapProductLineItem) {
        // If removed product is GiftWrapCategoryProduct than reset gift wrap attribute
        Transaction.wrap(function () {
            if (giftWrapProductLineItem.product.ID === pid) {
                var productLineItems = currentBasket
                    .getProductLineItems()
                    .toArray();
                for (var j = 0; j < productLineItems.length; j++) {
                    var pli = productLineItems[j];
                    pli.custom.isWrapped = false;
                    pli.custom.wrappedQuantity = 0;
                }
            } else {
                var base = require('*/cartridge/scripts/cart/cartHelpers');
                var product = productMgr.getProduct(pid);
                var productInCart = base.getExistingProductLineItemInCart(
                    product,
                    pid,
                    currentBasket.productLineItems
                );
                // If wrappable product
                // Than check is wrapped
                if (
                    product.custom.isGiftWrappable &&
                    productInCart.custom.isWrapped
                ) {
                    // Get total wrappable items
                    var productLineItemCount =
                        giftWrapHelpers.getWrappableProductCount(
                            currentBasket.getAllProductLineItems()
                        );
                    if (productLineItemCount === 1) {
                        // Fetch gift wrap category product
                        // RemoveProductLineItem
                        currentBasket.removeProductLineItem(
                            giftWrapProductLineItem
                        );
                    } else if (productInCart.custom.wrappedQuantity > 0) {
                        // Update Quantity of giftWrapped category product
                        if (
                            giftWrapProductLineItem.quantityValue >
                            productInCart.custom.wrappedQuantity
                        ) {
                            // UpdateQuantity
                            giftWrapProductLineItem.setQuantityValue(
                                giftWrapProductLineItem.quantityValue -
                                    productInCart.custom.wrappedQuantity
                            );
                        } else {
                            // RemoveProductLineItem
                            currentBasket.removeProductLineItem(
                                giftWrapProductLineItem
                            );
                        }
                    }
                }
            }
        });
    }
}

/**
 * @param {dw.order.Basket} currentBasket - Current Basket
 * @param {dw.order.ProductLineItem} giftWrapProductLineItem - Gift wrap product line item
 * @param {string} pid - product id
 * @param {number} quantity - quantity
 */
function handleUpdateQuantity(
    currentBasket,
    giftWrapProductLineItem,
    pid,
    quantity
) {
    var product = productMgr.getProduct(pid);
    var base = require('*/cartridge/scripts/cart/cartHelpers');
    var productInCart = base.getExistingProductLineItemInCart(
        product,
        pid,
        currentBasket.productLineItems
    );
    Transaction.wrap(function () {
        // If wrappable product
        // Than check is wrapped
        if (product.custom.isGiftWrappable && productInCart.custom.isWrapped) {
            if (productInCart.custom.wrappedQuantity > 0) {
                //  Update Quantity of giftWrapped category product
                if (productInCart.custom.wrappedQuantity > quantity) {
                    if (
                        giftWrapProductLineItem.quantityValue >
                        productInCart.custom.wrappedQuantity - quantity
                    ) {
                        giftWrapProductLineItem.setQuantityValue(
                            giftWrapProductLineItem.quantityValue -
                                (productInCart.custom.wrappedQuantity -
                                    quantity)
                        );
                    }
                    productInCart.custom.wrappedQuantity = Number(quantity);
                }
            }
        }
    });
}

/**
 *
 * @param {dw.order.Basket} currentBasket - Current Basket
 * @returns {object} - Return isml
 */
function getGiftWrapLineItemCart(currentBasket) {
    var CartModel = require('*/cartridge/models/cart');
    var basketModel = new CartModel(currentBasket);
    var individuallyWrappableUI = null;
    var giftWrapProductCard = null;
    if (basketModel.items.length > 0) {
        var giftWrapConfig = getGiftWrapConfig(basketModel.items);
        individuallyWrappableUI = renderTemplateHelper.getRenderedHtml(
            { wrappableProducts: giftWrapConfig.wrappableProducts },
            'cart/giftWrapIndividualProduct'
        );
    }
    if (basketModel.giftWrapItem) {
        var context = {
            giftWrapItem: basketModel.giftWrapItem
        };
        giftWrapProductCard = renderTemplateHelper.getRenderedHtml(
            context,
            'cart/productCard/cartGiftWrapProductCard'
        );
    }
    return {
        individuallyWrappableUI: individuallyWrappableUI,
        giftWrapProductCard: giftWrapProductCard
    };
}

module.exports = {
    getGiftWrapLineItem: getGiftWrapLineItem,
    getGiftWrapConfig: getGiftWrapConfig,
    removeGiftWrapLineItem: removeGiftWrapLineItem,
    updateWrapForAllProductLineItem: updateWrapForAllProductLineItem,
    handleRemoveProduct: handleRemoveProduct,
    handleUpdateQuantity: handleUpdateQuantity,
    getGiftWrapLineItemCart: getGiftWrapLineItemCart
};
