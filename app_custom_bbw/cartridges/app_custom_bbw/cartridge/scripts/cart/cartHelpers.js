'use strict';

var base = module.superModule;
var Resource = require('dw/web/Resource');
var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var collections = require('*/cartridge/scripts/util/collections');
var BONUS_PRODUCTS_PAGE_SIZE = 6;
var URLUtils = require('dw/web/URLUtils');

/**
 * @param {number} pid - ProductId
 * @returns {number} price of product
 */
function getProductPrice(pid) {
    var product = ProductMgr.getProduct(pid);
    return product.priceModel.price.value;
}

/**
 * Filter all the product line items matching productId and
 * has the same bundled items or options in the cart
 * @param {dw.catalog.Product} product - Product object
 * @param {string} productId - Product ID to match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's product line items
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @returns {dw.order.ProductLineItem[]} - Filtered all the product line item matching productId and has the same bundled items or options
 */
function getExistingProductLineItemsInCart(product, productId, productLineItems, childProducts, options) {
    var matchingProductsObj = base.getMatchingProducts(productId, productLineItems);
    var matchingProducts = matchingProductsObj.matchingProducts;
    var productLineItemsInCart = matchingProducts.filter(function (matchingProduct) {
        return product.bundle
            ? base.allBundleItemsSame(matchingProduct.bundledProductLineItems, childProducts)
            : base.hasSameOptions(matchingProduct.optionProductLineItems, options || [])
                && !(
                    'custom' in matchingProduct &&
                    'customBundle' in matchingProduct.custom &&
                    matchingProduct.custom.customBundle
                );
    });
    return productLineItemsInCart;
}

/**
 * Filter the product line item matching productId and
 * has the same bundled items or options in the cart
 * @param {dw.catalog.Product} product - Product object
 * @param {string} productId - Product ID to match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's
 *     product line items
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @returns {dw.order.ProductLineItem} - get the first product line item matching productId and
 *     has the same bundled items or options
 */
function getExistingProductLineItemInCart(product, productId, productLineItems, childProducts, options) {
    return getExistingProductLineItemsInCart(product, productId, productLineItems, childProducts, options)[0];
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

    var errorType = '';
    var productValidationHelpers = require('*/cartridge/scripts/helpers/productValidationHelpers');
    var maxOrderQty = productValidationHelpers.getProductMaxOrderQty(product);

    if (product.bundle) {
        canBeAdded = base.checkBundledProductCanBeAdded(childProducts, productLineItems, quantity);
    } else {
        totalQtyRequested = quantity + base.getQtyAlreadyInCart(productId, productLineItems);
        perpetual = product.availabilityModel.inventoryRecord.perpetual;
        canBeAdded = perpetual || totalQtyRequested <= maxOrderQty;
        errorType = 'maxOrderQty';
    }

    if (!canBeAdded) {
        result.error = true;
        if (errorType === 'maxOrderQty') {
            result.message = Resource.msgf(
                'error.alert.selected.quantity.cannot.be.added.negative',
                'product',
                null,
                maxOrderQty,
                product.name
            );
        } else {
            result.message = Resource.msgf(
                'error.alert.selected.quantity.cannot.be.added.for',
                'product',
                null,
                maxOrderQty,
                product.name
            );
        }
        return result;
    }

    productInCart = getExistingProductLineItemInCart(product, productId, productLineItems, childProducts, options);
    var isGiftCard =
        'custom' in product &&
        'isEgiftCard' in product.custom &&
        product.custom.isEgiftCard &&
        product.custom.isEgiftCard === true;
    result.message = isGiftCard ? Resource.msg('cart.updated.giftcard', 'giftcards', null) : result.message;
    if (productInCart && !isGiftCard && !productInCart.bonusProductLineItem) {
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
        if ('SID' in product.custom && product.custom.SID) {
            productLineItem.custom.SID = product.custom.SID;
        } else {
            productLineItem.custom.SID = '-';
        }
        // add category tree in product lineitem custom attribute
        var categoryTree = '';
        if (productLineItem.product.primaryCategory !== null) {
            categoryTree = productLineItem.product.primaryCategory.displayName;
            if (productLineItem.product.primaryCategory.parent !== null) {
                categoryTree += '>' + productLineItem.product.primaryCategory.parent.displayName;
                if (productLineItem.product.primaryCategory.parent.parent !== null) {
                    categoryTree += '>' + productLineItem.product.primaryCategory.parent.parent.displayName;
                }
            }
            productLineItem.custom.categoryTree = categoryTree;
        }
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
 * @param {object} lineItemContainer - lineItemContainer
 */
function callBackTransferToFree(
    productLineItem,
    qtyUpdateFreeItem,
    allLineItemsForProduct,
    indexOfMainItem,
    mergeQty,
    lineItemContainer
) {
    Transaction.wrap(function () {
        // reducing qty from free product
        if (qtyUpdateFreeItem === 0) {
            lineItemContainer.removeProductLineItem(productLineItem);
        } else {
            productLineItem.setQuantityValue(qtyUpdateFreeItem);
        }
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
 * @param {object} lineItemContainer - lineItemContainer
 */
function callBackMergeToFreeFromMain(
    productLineItem,
    productQtyAfterReduce,
    allLineItemsForProduct,
    indexOfFreeItem,
    qtyUpdateFreeItem,
    lineItemContainer
) {
    Transaction.wrap(function () {
        if (productQtyAfterReduce === 0) {
            lineItemContainer.removeProductLineItem(productLineItem);
        } else {
            productLineItem.setQuantityValue(productQtyAfterReduce);
        }
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
        if (productQtyAfterReduce === 0) {
            lineItemContainer.removeProductLineItem(productLineItem);
        } else {
            productLineItem.setQuantityValue(productQtyAfterReduce);
        }
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
                    if (productQtyAfterReduceFromFree > 0) {
                        splitQuantityFromFreeToMain(
                            productLineItem,
                            productQtyAfterReduceFromFree,
                            lineItemContainer,
                            qtyUpdateFreeItem
                        );
                        breakLoop = true;
                    }
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
                        mergeQty,
                        lineItemContainer
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
                    qtyUpdateFreeItem,
                    lineItemContainer
                );
                breakLoop = true;
            } else {
                if (productLineItem.quantityValue <= qtyUpdateFreeItem) {
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
        Transaction.wrap(function () {
            try {
                productLineItem.custom.proratedPrice = productLineItem.proratedPrice.value;
                productLineItem.custom.proratedDiscount = Number((productLineItem.price.value - productLineItem.proratedPrice.value).toFixed(2));
            } catch (error) {
                // eslint-disable-line no-empty
            }
        });
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
                            if (pli.isEgiftCard) {
                                for (var i = 0;i < currentBasket.productLineItems.length;i++) {
                                    if (currentBasket.productLineItems[i].UUID === result.uuid) {
                                        currentBasket.productLineItems[i].custom.eGiftReceiver = pli.eGiftReceiver;
                                        currentBasket.productLineItems[i].custom.eGiftReceiverEmail =pli.eGiftReceiverEmail;
                                        currentBasket.productLineItems[i].custom.eGiftSender = pli.eGiftSender;
                                        currentBasket.productLineItems[i].custom.eGiftMessage = pli.eGiftMessage;
                                        currentBasket.productLineItems[i].custom.eGiftCardScheduleDay = pli.eGiftCardScheduleDay;
                                        currentBasket.productLineItems[i].custom.eGiftCardScheduleMonth = pli.eGiftScheduleMonth;
                                        currentBasket.productLineItems[i].custom.eGiftVideoLink = pli.eGiftVideoLink;
                                        currentBasket.productLineItems[i].custom.eGiftScheduledYear = pli.eGiftScheduledYear;
                                        currentBasket.productLineItems[i].custom.isEgiftCard = true;
                                        currentBasket.productLineItems[i].custom.eGiftEmailPending = pli.eGiftEmailPending;
                                        break;
                                    }
                                }
                            }
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
    var topOffers = [];
    if (currentBasket) {
        var allLineItems = currentBasket.allProductLineItems;
        if (allLineItems.length > 0) {
            Transaction.wrap(function () {
                var PromotionMgr = require('dw/campaign/PromotionMgr');
                var activePromotions = PromotionMgr.getActivePromotions().promotions;
                if (activePromotions.length > 0) {
                    for(var i = 0; i < activePromotions.length; i++) {
                        var promo = activePromotions[i];
                        if (('couponCode' in promo.custom && promo.custom.couponCode) && ('showOnMiniCart' in promo.custom && promo.custom.showOnMiniCart === true) && promo.basedOnCoupon === true && promo.coupons[0].type === 'SINGLE_CODE') {
                            var topOffer = {
                                promo: promo,
                                couponCode: promo.custom.couponCode
                            };
                            topOffers.push(topOffer);
                        }
                    }
                }
            });
        }
    }
    return topOffers;
}


/**
 * Gets the newly added bonus discount line item
 * @param {dw.order.Basket} currentBasket -
 * @param {dw.util.Collection} previousBonusDiscountLineItems - contains BonusDiscountLineItems
 *                                                              already processed
 * @param {object} urlObject - Object with data to be used in the choice of bonus products modal
 * @param {string} pliUUID - the uuid of the qualifying product line item.
 * @returns {object} - either the object that represents data needed for the choice of
 *                    bonus products modal window or undefined
 */
function getNewBonusDiscountLineItem(
    currentBasket,
    previousBonusDiscountLineItems,
    urlObject,
    pliUUID
) {
    var bonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();
    var newBonusDiscountLineItem;
    var result = {};

    newBonusDiscountLineItem = collections.find(bonusDiscountLineItems, function (item) {
        return !previousBonusDiscountLineItems.contains(item);
    });

    collections.forEach(bonusDiscountLineItems, function (item) {
        if (!previousBonusDiscountLineItems.contains(item)) {
            Transaction.wrap(function () {
                item.custom.bonusProductLineItemUUID = pliUUID; // eslint-disable-line no-param-reassign
            });
        }
    });

    if (newBonusDiscountLineItem) {
        result.bonusChoiceRuleBased = newBonusDiscountLineItem.bonusChoiceRuleBased;
        result.bonuspids = [];
        var iterBonusProducts = newBonusDiscountLineItem.bonusProducts.iterator();
        while (iterBonusProducts.hasNext()) {
            var newBProduct = iterBonusProducts.next();
            result.bonuspids.push(newBProduct.ID);
        }
        result.uuid = newBonusDiscountLineItem.UUID;
        result.pliUUID = pliUUID;
        result.maxBonusItems = newBonusDiscountLineItem.maxBonusItems;
        result.addToCartUrl = urlObject.addToCartUrl;
        result.showProductsUrl = urlObject.configureProductstUrl;
        result.showProductsUrlListBased = URLUtils.url('Product-ShowBonusProducts', 'DUUID', newBonusDiscountLineItem.UUID, 'pids', result.bonuspids.toString(), 'maxpids', newBonusDiscountLineItem.maxBonusItems).toString();
        result.showProductsUrlRuleBased = URLUtils.url('Product-ShowBonusProducts', 'DUUID', newBonusDiscountLineItem.UUID, 'pagesize', BONUS_PRODUCTS_PAGE_SIZE, 'pagestart', 0, 'maxpids', newBonusDiscountLineItem.maxBonusItems).toString();
        result.pageSize = BONUS_PRODUCTS_PAGE_SIZE;
        result.configureProductstUrl = URLUtils.url('Product-ShowBonusProducts', 'pids', result.bonuspids.toString(), 'maxpids', newBonusDiscountLineItem.maxBonusItems).toString();
        result.newBonusDiscountLineItem = newBonusDiscountLineItem;
        result.labels = {
            close: Resource.msg('link.choiceofbonus.close', 'product', null),
            selectprods: Resource.msgf('modal.header.selectproducts', 'product', null, null),
            selectedprods:  Resource.msgf('modal.header.selected.products', 'product', null,0, newBonusDiscountLineItem.maxBonusItems),
            maxprods: Resource.msgf('label.choiceofbonus.selectproducts', 'product', null, newBonusDiscountLineItem.maxBonusItems)
        };
    }
    return newBonusDiscountLineItem ? result : undefined;
}

base.getNewBonusDiscountLineItem = getNewBonusDiscountLineItem;
base.createFreeLineItem = createFreeLineItem;
base.checkCouponCodeError = checkCouponCodeError;;
base.addProductToCart = addProductToCart;
base.getProductPrice = getProductPrice;
base.mergeCart = mergeCart;
base.getTopOffers = getTopOffers;
base.getExistingProductLineItemsInCart = getExistingProductLineItemsInCart;
base.getExistingProductLineItemInCart = getExistingProductLineItemInCart;
module.exports = base;
