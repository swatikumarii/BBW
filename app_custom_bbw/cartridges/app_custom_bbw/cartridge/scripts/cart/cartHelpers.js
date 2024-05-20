'use strict';

var base = module.superModule;
var Resource = require('dw/web/Resource');
var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');

/**
 * @param {number} pid - ProductId
 * @returns {number} price of product
 */
function getProductPrice(pid) {
    var product = ProductMgr.getProduct(pid);
    return product.priceModel.price.value;
}

/**
 * Adds a product to the cart. If the product is already in the cart it increases the quantity of
 * that product.
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {string} productId - the productId of the product being added to the cart
 * @param {number} quantity - the number of products to the cart
 * @param {string[]} childProducts - the products' sub-products
 * @param {object} options - product options
 * @returns {object} returns an error object
 */
function addProductToCart(currentBasket, productId, quantity, childProducts, options) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var availableToSell;
    var defaultShipment = currentBasket.defaultShipment;
    var perpetual;
    var product = ProductMgr.getProduct(productId);
    var productInCart;
    var productLineItems = currentBasket.productLineItems;
    var productQuantityInCart;
    var quantityToSet;
    var optionModel = productHelper.getCurrentOptionModel(product.optionModel, options);
    var result = {
        error: false,
        message: Resource.msg('text.alert.addedtobasket', 'product', null)
    };

    var totalQtyRequested = 0;
    var canBeAdded = false;

    var productLevelReserveQty =
        'custom' in product &&
        'reserveQty' in product.custom &&
        product.custom.reserveQty
            ? product.custom.reserveQty
            : 0;
    var productLevelMaxOrderQty =
        'custom' in product &&
        'maxOrderQty' in product.custom &&
        product.custom.maxOrderQty
            ? product.custom.maxOrderQty
            : false;
    var globalLevelMaxOrderQty = dw.system.Site.getCurrent().getCustomPreferenceValue('maxOrderQty');
    var globalLevelReserveQty = dw.system.Site.getCurrent().getCustomPreferenceValue('reserveQty');
    var maxOrderQty = productLevelMaxOrderQty || globalLevelMaxOrderQty;
    var reserveOosQty = productLevelReserveQty || globalLevelReserveQty;
    var maxOrderQtyByReserveStock =
        product.availabilityModel.inventoryRecord.ATS.value - reserveOosQty;
    if (maxOrderQty && maxOrderQtyByReserveStock) {
        maxOrderQty =
            maxOrderQtyByReserveStock < maxOrderQty
                ? maxOrderQtyByReserveStock
                : maxOrderQty;
    } else if (!maxOrderQty) {
        maxOrderQty = maxOrderQtyByReserveStock;
    }
    var errorType = '';
    if (product.bundle) {
        canBeAdded = base.checkBundledProductCanBeAdded(childProducts, productLineItems, quantity);
    } else if (maxOrderQty) {
        totalQtyRequested = quantity + base.getQtyAlreadyInCart(productId, productLineItems);
        perpetual = product.availabilityModel.inventoryRecord.perpetual;
        canBeAdded = perpetual || totalQtyRequested <= maxOrderQty;
        errorType = 'maxOrderQty';
    } else {
        totalQtyRequested = quantity + base.getQtyAlreadyInCart(productId, productLineItems);
        perpetual = product.availabilityModel.inventoryRecord.perpetual;
        canBeAdded = (perpetual
                || totalQtyRequested <= (product.availabilityModel.inventoryRecord.ATS.value - reserveOosQty));
        errorType = 'reserveOosQty';
    }

    if (!canBeAdded) {
        result.error = true;
        if (errorType === 'maxOrderQty') {
            result.message = Resource.msgf(
                'error.alert.selected.quantity.cannot.be.added.for.max',
                'product',
                null,
                maxOrderQty,
                product.name);
        } else {
            result.message = Resource.msgf(
                'error.alert.selected.quantity.cannot.be.added.for',
                'product',
                null,
                product.availabilityModel.inventoryRecord.ATS.value - reserveOosQty,
                product.name);
        }
        return result;
    }

    productInCart = base.getExistingProductLineItemInCart(product, productId, productLineItems, childProducts, options);
    var isGiftCard =
        'custom' in product &&
        'isEgiftCard' in product.custom &&
        product.custom.isEgiftCard &&
        product.custom.isEgiftCard === true;

    if (productInCart && !isGiftCard) {
        productQuantityInCart = productInCart.quantity.value;
        quantityToSet = quantity
            ? quantity + productQuantityInCart
            : productQuantityInCart + 1;
        availableToSell =
            productInCart.product.availabilityModel.inventoryRecord.ATS.value;

        if (availableToSell >= quantityToSet || perpetual) {
            productInCart.setQuantityValue(quantityToSet);
            result.uuid = productInCart.UUID;
        } else {
            result.error = true;
            result.message =
                availableToSell === productQuantityInCart
                    ? Resource.msg(
                        'error.alert.max.quantity.in.cart',
                        'product',
                        null
                    )
                    : Resource.msg(
                        'error.alert.selected.quantity.cannot.be.added',
                        'product',
                        null
                    );
        }
    } else {
        var productLineItem;
        productLineItem = base.addLineItem(
            currentBasket,
            product,
            quantity,
            childProducts,
            optionModel,
            defaultShipment
        );

        result.uuid = productLineItem.UUID;
    }

    return result;
}


/**
 * callback for transaction
 * @param {object} productLineItem - productLineItem
 * @param {number} qtyUpdateFreeItem - qtyUpdateFreeItem
 * @param {Array} allLineItemsForProduct - allLineItemsForProduct
 * @param {number} indexOfMainItem - indexOfMainItem
 * @param {number} mergeQty - mergeQty
 */
function callBackTransferToFree(
    productLineItem,
    qtyUpdateFreeItem,
    allLineItemsForProduct,
    indexOfMainItem,
    mergeQty
) {
    Transaction.wrap(function(){
        // reducing qty from free product
        productLineItem.setQuantityValue(qtyUpdateFreeItem);
        // increasing the diff in main product
        allLineItemsForProduct[indexOfMainItem].setQuantityValue(mergeQty);
    });
}

/**
 * callback for transaction
 * @param {object} lineItemContainer - lineItemContainer
 * @param {object} productLineItem - productLineItem
 * @param {Array} allLineItemsForProduct - allLineItemsForProduct
 * @param {number} indexOfMainItem - indexOfMainItem
 * @param {number} mergeQty - mergeQty
 */
function callBackTransferToMain (
    lineItemContainer,
    productLineItem,
    allLineItemsForProduct,
    indexOfMainItem,
    mergeQty
) {
    Transaction.wrap(function(){
        lineItemContainer.removeProductLineItem(productLineItem);
        allLineItemsForProduct[indexOfMainItem].setQuantityValue(mergeQty);
    });
}

/**
 * callback for transaction
 * @param {object} productLineItem - productLineItem
 * @param {number} productQtyAfterReduce - productQtyAfterReduce
 * @param {Array} allLineItemsForProduct - allLineItemsForProduct
 * @param {number} indexOfFreeItem - indexOfFreeItem
 * @param {number} qtyUpdateFreeItem - qtyUpdateFreeItem
 */
function callBackMergeToFreeFromMain(
    productLineItem,
    productQtyAfterReduce,
    allLineItemsForProduct,
    indexOfFreeItem,
    qtyUpdateFreeItem
) {
    Transaction.wrap(function(){
        productLineItem.setQuantityValue(productQtyAfterReduce);
        var updatedQtyFreeItem =
            allLineItemsForProduct[indexOfFreeItem].quantityValue +
            qtyUpdateFreeItem;
        allLineItemsForProduct[indexOfFreeItem].setQuantityValue(
            updatedQtyFreeItem
        );
    });
}

/**
 * callback for transaction
 * @param {object} productLineItem - productLineItem
 * @param {number} productQtyAfterReduce - productQtyAfterReduce
 * @param {object} lineItemContainer - lineItemContainer
 * @param {number} qtyUpdateFreeItem - qtyUpdateFreeItem
 */
function callBackCreateNewFreeItem(
    productLineItem,
    productQtyAfterReduce,
    lineItemContainer,
    qtyUpdateFreeItem
) {
    Transaction.wrap(function(){
        productLineItem.setQuantityValue(productQtyAfterReduce);
        var newProductLineItem = lineItemContainer.createProductLineItem(
            productLineItem.productID,
            lineItemContainer.defaultShipment
        );
        newProductLineItem.custom.isFreeItem = true;
        newProductLineItem.setQuantityValue(qtyUpdateFreeItem);
    });
}
/**
 *
 * @param {object} productLineItem - productLineItem
 */
function callBackSetItemAsFree(productLineItem) {
    Transaction.wrap(function () {
        // eslint-disable-next-line no-param-reassign
        productLineItem.custom.isFreeItem = true;
    });
}

/**
 * splitQuantityFromFreeToMain
 * @param {object} productLineItem - productLineItem
 * @param {number} productQtyAfterReduce - productQtyAfterReduce
 * @param {object} lineItemContainer - lineItemContainer
 * @param {number} qtyUpdateFreeItem - qtyUpdateFreeItem
 */
function splitQuantityFromFreeToMain(
    productLineItem,
    productQtyAfterReduce,
    lineItemContainer,
    qtyUpdateFreeItem
) {
    Transaction.wrap(function () {
        // eslint-disable-next-line no-param-reassign
        productLineItem.custom.isFreeItem = false;
    });
    callBackCreateNewFreeItem(
        productLineItem,
        productQtyAfterReduce,
        lineItemContainer,
        qtyUpdateFreeItem
    );
}

/**
 * setFreeFalse
 * @param {object} productLineItem - productLineItem
 */
function setFreeFalse(productLineItem) {
    Transaction.wrap(function () {
        // eslint-disable-next-line no-param-reassign
        productLineItem.custom.isFreeItem = false;
    });
}

/**
 * createFreeLineItem - Creates a different lineItem for BOGO promo free products
 * @param {object} lineItemContainer current basket
 * @returns {boolean} if there is any change
 */
function createFreeLineItem(lineItemContainer) {
    var breakLoop = false;
    var changes = false;
    var allProductLineItems = lineItemContainer.allProductLineItems;
    var iterator = allProductLineItems.iterator();
    while(iterator.hasNext()) {
        var productLineItem = iterator.next();
        var isFreeItem = false;
        var shouldHaveFreeItem = false;
        var qtyUpdateFreeItem = 0;
        if (
            'custom' in productLineItem &&
            productLineItem.custom &&
            'isFreeItem' in productLineItem.custom &&
            productLineItem.custom.isFreeItem
        ) {
            isFreeItem = true;
        }
        if (
            productLineItem.priceAdjustments &&
            productLineItem.priceAdjustments.length > 0
        ) {
            var priceAdjustments = productLineItem.priceAdjustments.toArray();
            for (
                var adjustmentIndex = 0;
                adjustmentIndex < priceAdjustments.length;
                adjustmentIndex++
            ) {
                var adjustment = priceAdjustments[adjustmentIndex];
                if (
                    'appliedDiscount' in adjustment &&
                    adjustment.appliedDiscount.type === 'FREE'
                ) {
                    shouldHaveFreeItem = true;
                    qtyUpdateFreeItem += adjustment.quantity;
                }
            }
        }
        var allLineItemsForProduct = lineItemContainer.getProductLineItems(productLineItem.productID);
        if (isFreeItem) {
            var indexOfMainItem;
            var mergeQty;
            for (
                var index = 0;
                index < allLineItemsForProduct.length;
                index++
            ) {
                if (
                    !(
                        allLineItemsForProduct[index].UUID ===
                        productLineItem.UUID
                    )
                ) {
                    indexOfMainItem = index;
                }
            }
            if (shouldHaveFreeItem) {
                if (allLineItemsForProduct.length === 1) {
                    var productQtyAfterReduceFromFree =
                        productLineItem.quantityValue - qtyUpdateFreeItem;
                    splitQuantityFromFreeToMain(
                        productLineItem,
                        productQtyAfterReduceFromFree,
                        lineItemContainer,
                        qtyUpdateFreeItem
                    );
                    breakLoop = true;
                } else if (qtyUpdateFreeItem < productLineItem.quantityValue) {
                    mergeQty =
                        productLineItem.quantityValue -
                        qtyUpdateFreeItem +
                        allLineItemsForProduct[indexOfMainItem].quantityValue;
                    // No of free products is less than free item qty, so will reduce from free lineitem and merge in main lineitem
                    callBackTransferToFree(
                        productLineItem,
                        qtyUpdateFreeItem,
                        allLineItemsForProduct,
                        indexOfMainItem,
                        mergeQty
                    );
                    breakLoop = true;
                }
            } else if (allLineItemsForProduct.length > 1) {
                // Removing the free lineitem and merging its qty in main lineitem
                mergeQty =
                    allLineItemsForProduct[indexOfMainItem].quantityValue +
                    productLineItem.quantityValue;
                callBackTransferToMain(
                    lineItemContainer,
                    productLineItem,
                    allLineItemsForProduct,
                    indexOfMainItem,
                    mergeQty
                );
                breakLoop = true;
            } else {
                setFreeFalse(productLineItem);
                breakLoop = true;
            }
        } else if (shouldHaveFreeItem) {
            var productQtyAfterReduce =
                productLineItem.quantityValue - qtyUpdateFreeItem;
            if (allLineItemsForProduct.length > 1) {
                // reduce and merge
                var indexOfFreeItem;
                for (var i = 0; i < allLineItemsForProduct.length; i++) {
                    if (
                        !(
                            allLineItemsForProduct[i].UUID ===
                            productLineItem.UUID
                        )
                    ) {
                        indexOfFreeItem = i;
                    }
                }
                callBackMergeToFreeFromMain(
                    productLineItem,
                    productQtyAfterReduce,
                    allLineItemsForProduct,
                    indexOfFreeItem,
                    qtyUpdateFreeItem
                );
                breakLoop = true;
            } else {
                if (productLineItem.quantityValue ===1) {
                    callBackSetItemAsFree(productLineItem);
                } else {
                    callBackCreateNewFreeItem(
                        productLineItem,
                        productQtyAfterReduce,
                        lineItemContainer,
                        qtyUpdateFreeItem
                    );
                }
                breakLoop = true;
            }
        }
        if (breakLoop) {
            changes = true;
            break; // Exit the loop
        }
    }
    if (breakLoop) {
        var HookMgr = require('dw/system/HookMgr');
        Transaction.wrap(function () {
            HookMgr.callHook('dw.order.calculate', 'calculate', lineItemContainer);
        });
        var currentBasket = BasketMgr.getCurrentBasket();
        var recChanges = createFreeLineItem(currentBasket);
        if (recChanges) {
            return recChanges;
        }
    }
    return changes;
}

/**
 * getCouponNoActivePromoError - gets error for no active promotion
 * @param {string} couponCode - coupon code
 * @returns {string} error message
 */
function getCouponNoActivePromoError(couponCode) {
    var CouponMgr = require('dw/campaign/CouponMgr');
    var coupon = CouponMgr.getCouponByCode(couponCode);
    var promotion = coupon.promotions[0];
    var requestCustomerGroups = [];
    var promoCustomerGroups = [];
    request.session.customer.customerGroups.toArray().forEach( function (customerGroup) {
        requestCustomerGroups.push(customerGroup.ID);
    });
    promotion.customerGroups.toArray().forEach(function (customerGroup) {
        promoCustomerGroups.push(customerGroup.ID);
    });
    var customerGroupEligible = promoCustomerGroups.some(
        function (promoCustomerGroup) {
            return requestCustomerGroups.includes(promoCustomerGroup);
        }
    );
    if (!customerGroupEligible) {
        return Resource.msg('error.customer.not.qualified', 'cart', null);
    }
    return Resource.msg('error.unable.to.add.coupon', 'cart', null);
}

/**
 * checkCouponCodeError checks the error in coupon and returns message
 * @param {string} couponCode coupon code
 * @param {string} errorCode error code while applying coupon
 * @returns {string} error message
 */
function checkCouponCodeError (couponCode, errorCode) {
    var errorMessage;
    switch (errorCode) {
        case 'COUPON_CODE_ALREADY_IN_BASKET':
            errorMessage = Resource.msg(
                'error.coupon.already.in.cart',
                'cart',
                null
            );
            break;
        case 'COUPON_ALREADY_IN_BASKET':
            errorMessage = Resource.msg(
                'error.coupon.cannot.be.combined',
                'cart',
                null
            );
            break;
        case 'COUPON_CODE_ALREADY_REDEEMED':
            errorMessage = Resource.msg(
                'error.coupon.already.redeemed',
                'cart',
                null
            );
            break;
        case 'COUPON_CODE_UNKNOWN':
            errorMessage = Resource.msg('error.coupon.unknown', 'cart', null);
            break;
        case 'COUPON_DISABLED':
            errorMessage = Resource.msg('error.coupon.disabled', 'cart', null);
            break;
        case 'REDEMPTION_LIMIT_EXCEEDED':
            errorMessage = Resource.msg(
                'error.coupon.redemption.limit',
                'cart',
                null
            );
            break;
        case 'TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED':
            errorMessage = Resource.msg(
                'error.coupon.redemption.limit',
                'cart',
                null
            );
            break;
        case 'NO_ACTIVE_PROMOTION':
            errorMessage = getCouponNoActivePromoError(couponCode);
            break;

        default:
            errorMessage = Resource.msg(
                'error.unable.to.add.coupon',
                'cart',
                null
            );
            break;
    }
    return errorMessage;
}

/**
 * Function mergeCart merges the items from the stored basket to the currentBasket.
 * @param {Array} storedBasketProducts - Stored Basket Product detail list
 * @returns {object} resultObj - contain updated basket and boolean value
 */
function mergeCart(storedBasketProducts) {
    var Logger = require('dw/system/Logger');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var isCartMerged = false;
    var resultObj = {};

    try {
        if (currentBasket && storedBasketProducts.length) {
            for (var index = 0; index < storedBasketProducts.length; index++) {
                var pli = storedBasketProducts[index];
                if (!pli.bundledProductLineItem && !pli.optionProductLineItem) {
                    var childProducts = [];
                    var optionProducts = [];
                    var mergeQty = pli.quantityValue;
                    if (!pli.bonusProductLineItem) {
                        var result = base.addProductToCart(
                            currentBasket,
                            pli.productID,
                            mergeQty,
                            childProducts,
                            optionProducts
                        );
                        if (!result.error) {
                            isCartMerged = true;
                        }
                    }
                }
            }
            basketCalculationHelpers.calculateTotals(currentBasket);
        }
    } catch (e) {
        isCartMerged = false;
        Logger.error(
            'Exception occoured while executing merge cart function: {0}' +
                e.message
        );
    }

    resultObj.isCartMerged = isCartMerged;
    resultObj.currentBasket = currentBasket;

    return resultObj;
}

/**
 * Function getTopOffers is using to get all active promotions
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @returns {Array} topOffers - contain top offers
 */
function getTopOffers(currentBasket) {
    var collections = require('*/cartridge/scripts/util/collections');
    var topOffers = [];
    if (currentBasket) {
        var allLineItems = currentBasket.allProductLineItems;
        if (allLineItems.length > 0) {
            Transaction.wrap(function () {
                collections.forEach(allLineItems, function (pli) {
                    var PromotionMgr = require('dw/campaign/PromotionMgr');
                    var activePromotions = PromotionMgr.getActivePromotions().getProductPromotions(pli.product);
                    if (activePromotions.length > 0) {
                        for(var i = 0; i < activePromotions.length; i++) {
                            var promo = activePromotions[i];
                            if (promo.basedOnCoupon === true && promo.coupons[0].type === 'SINGLE_CODE') {
                                var topOffer = {
                                    promoName: promo.name,
                                    couponCode: promo.coupons[0].ID
                                };
                                topOffers.push(topOffer);
                            }
                        }
                    }
                });
            });
        }
    }
    return topOffers;
}

base.createFreeLineItem = createFreeLineItem;
base.checkCouponCodeError = checkCouponCodeError;;
base.addProductToCart = addProductToCart;
base.getProductPrice = getProductPrice;
base.mergeCart = mergeCart;
base.getTopOffers = getTopOffers;
module.exports = base;
