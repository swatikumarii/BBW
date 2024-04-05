'use strict';

var base = module.superModule;
var Resource = require('dw/web/Resource');
var ProductMgr = require('dw/catalog/ProductMgr');
var collections = require('*/cartridge/scripts/util/collections');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');


/**
 * Determines whether a product's current options are the same as those just selected
 *
 * @param {dw.util.Collection} existingOptions - Options currently associated with this product
 * @param {SelectedOption[]} selectedOptions - Product options just selected
 * @return {boolean} - Whether a product's current options are the same as those just selected
 */
function hasSameOptions(existingOptions, selectedOptions) {
    var selected = {};
    for (var i = 0, j = selectedOptions.length; i < j; i++) {
        selected[selectedOptions[i].optionId] = selectedOptions[i].selectedValueId;
    }
    return collections.every(existingOptions, function (option) {
        return option.optionValueID === selected[option.optionID];
    });
}


/**
 * Sets a flag to exclude the quantity for a product line item matching the provided UUID.  When
 * updating a quantity for an already existing line item, we want to exclude the line item's
 * quantity and use the updated quantity instead.
 * @param {string} selectedUuid - Line item UUID to exclude
 * @param {string} itemUuid - Line item in-process to consider for exclusion
 * @return {boolean} - Whether to include the line item's quantity
 */
function excludeUuid(selectedUuid, itemUuid) {
    return selectedUuid
        ? itemUuid !== selectedUuid
        : true;
}


/**
 * Adds a line item for this product to the Cart
 *
 * @param {dw.order.Basket} currentBasket -
 * @param {dw.catalog.Product} product -
 * @param {number} quantity - Quantity to add
 * @param {string[]}  childProducts - the products' sub-products
 * @param {dw.catalog.ProductOptionModel} optionModel - the product's option model
 * @param {dw.order.Shipment} defaultShipment - the cart's default shipment method
 * @return {dw.order.ProductLineItem} - The added product line item
 */
function addLineItem(
    currentBasket,
    product,
    quantity,
    childProducts,
    optionModel,
    defaultShipment
) {
    var productLineItem = currentBasket.createProductLineItem(
        product,
        optionModel,
        defaultShipment
    );

    if (product.bundle && childProducts.length) {
        updateBundleProducts(productLineItem, childProducts);
    }

    productLineItem.setQuantityValue(quantity);

    return productLineItem;
}


/**
 * Find all line items that contain the product specified.  A product can appear in different line
 * items that have different option selections or in product bundles.
 *
 * @param {string} productId - Product ID to match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's
 *     product line items
 * @return {Object} properties includes,
 *                  matchingProducts - collection of matching products
 *                  uuid - string value for the last product line item
 * @return {dw.order.ProductLineItem[]} - Filtered list of product line items matching productId
 */
function getMatchingProducts(productId, productLineItems) {
    var matchingProducts = [];
    var uuid;
    collections.forEach(productLineItems, function (item) {
        if (item.productID === productId) {
            matchingProducts.push(item);
            uuid = item.UUID;
        }
    });
    return {
        matchingProducts: matchingProducts,
        uuid: uuid
    };
}


/**
 * Filter all the product line items matching productId and
 * has the same bundled items or options in the cart
 * @param {dw.catalog.Product} product - Product object
 * @param {string} productId - Product ID to match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's
 *     product line items
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @return {dw.order.ProductLineItem[]} - Filtered all the product line item matching productId and
 *     has the same bundled items or options
 */
function getExistingProductLineItemsInCart(product, productId, productLineItems, childProducts, options) {
    var matchingProductsObj = getMatchingProducts(productId, productLineItems);
    var matchingProducts = matchingProductsObj.matchingProducts;
    var productLineItemsInCart = matchingProducts.filter(function (matchingProduct) {
        return product.bundle
            ? allBundleItemsSame(matchingProduct.bundledProductLineItems, childProducts)
            : hasSameOptions(matchingProduct.optionProductLineItems, options || []);
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
 * @return {dw.order.ProductLineItem} - get the first product line item matching productId and
 *     has the same bundled items or options
 */
function getExistingProductLineItemInCart(product, productId, productLineItems, childProducts, options) {
    return getExistingProductLineItemsInCart(product, productId, productLineItems, childProducts, options)[0];
}


/**
 * Calculate the quantities for any existing instance of a product, either as a single line item
 * with the same or different options, as well as inclusion in product bundles.  Providing an
 * optional "uuid" parameter, typically when updating the quantity in the Cart, will exclude the
 * quantity for the matching line item, as the updated quantity will be used instead.  "uuid" is not
 * used when adding a product to the Cart.
 *
 * @param {string} productId - ID of product to be added or updated
 * @param {dw.util.Collection<dw.order.ProductLineItem>} lineItems - Cart product line items
 * @param {string} [uuid] - When provided, excludes the quantity for the matching line item
 * @return {number} - Total quantity of all instances of requested product in the Cart and being
 *     requested
 */
function getQtyAlreadyInCart(productId, lineItems, uuid) {
    var qtyAlreadyInCart = 0;

    collections.forEach(lineItems, function (item) {
        if (item.bundledProductLineItems.length) {
            collections.forEach(item.bundledProductLineItems, function (bundleItem) {
                if (bundleItem.productID === productId && excludeUuid(uuid, bundleItem.UUID)) {
                    qtyAlreadyInCart += bundleItem.quantityValue;
                }
            });
        } else if (item.productID === productId && excludeUuid(uuid, item.UUID)) {
            qtyAlreadyInCart += item.quantityValue;
        }
    });
    return qtyAlreadyInCart;
}

/**
 * Adds a product to the cart. If the product is already in the cart it increases the quantity of
 * that product.
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {string} productId - the productId of the product being added to the cart
 * @param {number} quantity - the number of products to the cart
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 *  @return {Object} returns an error object
 */
function addProductToCart(currentBasket, productId, quantity, childProducts, options) {
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
    var globalLevelReserveQty = dw.system.Site.getCurrent().getCustomPreferenceValue('reserveQty');
    var reserveOosQty = productLevelReserveQty || globalLevelReserveQty;

    if (product.bundle) {
        canBeAdded = checkBundledProductCanBeAdded(childProducts, productLineItems, quantity);
    } else {
        totalQtyRequested = quantity + getQtyAlreadyInCart(productId, productLineItems);
        perpetual = product.availabilityModel.inventoryRecord.perpetual;
        canBeAdded = (perpetual
            || totalQtyRequested <= (product.availabilityModel.inventoryRecord.ATS.value - reserveOosQty));
    }

    if (!canBeAdded) {
        result.error = true;
        result.message = Resource.msgf(
            'error.alert.selected.quantity.cannot.be.added.for',
            'product',
            null,
            product.availabilityModel.inventoryRecord.ATS.value - reserveOosQty,
            product.name
        );
        return result;
    }

    productInCart = getExistingProductLineItemInCart(product, productId, productLineItems, childProducts, options);

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
        productLineItem = addLineItem(
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
