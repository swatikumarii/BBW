'use strict';

var Resource = require('dw/web/Resource');
var ProductMgr = require('dw/catalog/ProductMgr');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

/**
 * Adds a product to the cart. If the product is already in the cart it increases the quantity of
 * that product.
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {string} productId - the productId of the product being added to the cart
 * @param {number} quantity - the number of products to the cart
 * @param {string[]} childProducts - the products' sub-products
 * @param {object[]} options - product options
 * @param {string} customBundle - custom bundle
 * @param {number} bundleIndex - custom bundle
 * @returns {object} returns an error object
 */
function addProductToCart(
    currentBasket,
    productId,
    quantity,
    childProducts,
    options,
    customBundle,
    bundleIndex
) {
    // var availableToSell;
    var defaultShipment = currentBasket.defaultShipment;
    var perpetual;
    var product = ProductMgr.getProduct(productId);
    // var productInCart;
    var productLineItems = currentBasket.productLineItems;
    // var productQuantityInCart;
    // var quantityToSet;
    var optionModel = productHelper.getCurrentOptionModel(
        product.optionModel,
        options
    );
    var result = {
        error: false,
        message: Resource.msg('text.alert.addedtobasket', 'product', null)
    };

    var totalQtyRequested = 0;
    var canBeAdded = false;

    if (product.bundle) {
        canBeAdded = cartHelper.checkBundledProductCanBeAdded(
            childProducts,
            productLineItems,
            quantity
        );
    } else {
        totalQtyRequested =
            quantity +
            cartHelper.getQtyAlreadyInCart(productId, productLineItems);
        perpetual = product.availabilityModel.inventoryRecord.perpetual;
        canBeAdded =
            perpetual ||
            totalQtyRequested <=
                product.availabilityModel.inventoryRecord.ATS.value;
    }

    if (!canBeAdded) {
        result.error = true;
        result.message = Resource.msgf(
            'error.alert.selected.quantity.cannot.be.added.for',
            'product',
            null,
            product.availabilityModel.inventoryRecord.ATS.value,
            product.name
        );
        return result;
    }

    // productInCart = cartHelper.getExistingProductLineItemInCart(
    //     product,
    //     productId,
    //     productLineItems,
    //     childProducts,
    //     options
    // );

    // if (productInCart) {
    //     productQuantityInCart = productInCart.quantity.value;
    //     quantityToSet = quantity
    //         ? quantity + productQuantityInCart
    //         : productQuantityInCart + 1;
    //     availableToSell =
    //         productInCart.product.availabilityModel.inventoryRecord.ATS.value;

    //     if (availableToSell >= quantityToSet || perpetual) {
    //         productInCart.setQuantityValue(quantityToSet);
    //         result.uuid = productInCart.UUID;
    //     } else {
    //         result.error = true;
    //         result.message =
    //             availableToSell === productQuantityInCart
    //                 ? Resource.msg(
    //                     'error.alert.max.quantity.in.cart',
    //                     'product',
    //                     null
    //                 )
    //                 : Resource.msg(
    //                     'error.alert.selected.quantity.cannot.be.added',
    //                     'product',
    //                     null
    //                 );
    //     }
    // } else {
    var productLineItem;
    productLineItem = cartHelper.addLineItem(
        currentBasket,
        product,
        quantity,
        childProducts,
        optionModel,
        defaultShipment
    );
    productLineItem.custom.customBundle = customBundle;
    productLineItem.custom.customBundleIndex = bundleIndex;
    result.uuid = productLineItem.UUID;
    // result.pli = productLineItem;
    // }

    return result;
}

/**
 * Filter all the product line items matching productId and
 * has the same items or options in the cart
 * @param {string} productId - Product ID to match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's
 *     product line items
 * @returns {dw.order.ProductLineItem[]} - Filtered all the product line item matching productId and
 *     has the same items or options
 */
function getExistingNonBundleProductLineItemsInCart(productId, productLineItems) {
    var matchingProductsObj = cartHelper.getMatchingProducts(
        productId,
        productLineItems
    );
    var matchingProducts = matchingProductsObj.matchingProducts;
    var productLineItemsInCart;
    for (var i = 0; i < matchingProducts.length; i++) {
        if (!matchingProducts[i].custom.customBundle) {
            productLineItemsInCart = matchingProducts[i];
        }
    }
    return productLineItemsInCart;
}

module.exports = {
    addProductToCart: addProductToCart,
    getExistingNonBundleProductLineItemsInCart:
        getExistingNonBundleProductLineItemsInCart
};
