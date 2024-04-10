'use strict';

var base = module.superModule;
var Resource = require('dw/web/Resource');
var ProductMgr = require('dw/catalog/ProductMgr');


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
    var errorType = '';
    if (product.bundle) {
        canBeAdded = base.checkBundledProductCanBeAdded(childProducts, productLineItems, quantity);
    } else if (maxOrderQty) {
        totalQtyRequested = quantity + base.getQtyAlreadyInCart(productId, productLineItems);
        perpetual = product.availabilityModel.inventoryRecord.perpetual;
        canBeAdded = (perpetual
                || totalQtyRequested <= (product.availabilityModel.inventoryRecord.ATS.value - reserveOosQty)) && totalQtyRequested <= maxOrderQty;
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

    if (productInCart) {
        productQuantityInCart = productInCart.quantity.value;
        quantityToSet = quantity ? quantity + productQuantityInCart : productQuantityInCart + 1;
        availableToSell = productInCart.product.availabilityModel.inventoryRecord.ATS.value;

        if (availableToSell >= quantityToSet || perpetual) {
            productInCart.setQuantityValue(quantityToSet);
            result.uuid = productInCart.UUID;
        } else {
            result.error = true;
            result.message = availableToSell === productQuantityInCart
                ? Resource.msg('error.alert.max.quantity.in.cart', 'product', null)
                : Resource.msg('error.alert.selected.quantity.cannot.be.added', 'product', null);
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

base.addProductToCart = addProductToCart;
module.exports = base;
