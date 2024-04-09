'use strict';

var server = require('server');
server.extend(module.superModule);

var site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');
var BasketMgr = require('dw/order/BasketMgr');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var productMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');
var fullProduct = require('*/cartridge/models/product/fullProduct');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var commonHelpers = require('*/cartridge/models/scripts/util/commonHelpers');

/**
 * Get online products by category category should not null
 * @param {string} categoryName The first number.
 * @returns {dw.util.Collection} collection - Collection of online products.
 */
function getOnlineProductsByCategory(categoryName) {
    var category = CatalogMgr.getCategory(categoryName);
    return category ? category.onlineProducts : [];
}

/**
 * Get all online Gift wrap products
 * @param {dw.util.Collection} products : Products
 * @returns {Array} Full product information according to @link cartridge/models/product/fullProduct.
 */
function fetchFullProducts(products) {
    var fullProducts = [];
    for (var i = 0; i < products.length; i++) {
        if (products[i].availabilityModel.inStock) {
            var product = Object.create(null);
            var pid = products[i].ID;
            var productTileParams = { pview: 'tile', pid: pid };
            var apiProduct = productMgr.getProduct(pid);
            var options = productHelper.getConfig(
                apiProduct,
                productTileParams
            );
            fullProducts.push(
                fullProduct(product, options.apiProduct, options)
            );
        }
    }
    return fullProducts;
}

/**
 * Find ProductLineItem from productLineItems on category name match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems : Product line items
 * @param {string} categoryName : category name
 * @returns {dw.order.ProductLineItem} : Retrun product line item is category matches else return null
 */
function getProductLineItemByCategory(productLineItems, categoryName) {
    var productLineItem = null;
    collections.forEach(productLineItems, function(pli) {
        if (commonHelpers.isCategoryMatches(pli.product, categoryName)) {
            productLineItem = pli;
        }
    });
    return productLineItem;
}

/**
 * Get all online Gift wrap products
 * @returns {dw.util.Collection} collection - Collection of online products.
 */
function getGiftWrapProducts() {
    return fetchFullProducts(
        getOnlineProductsByCategory(
            site.current.getCustomPreferenceValue('giftWrapCategoryName')
        )
    );
}

/**
 * Get all online Greeting card products
 * @returns {dw.util.Collection} collection - Collection of online products.
 */
function getGreetingCardProducts() {
    return commonHelpers.fetchFullProducts(
        commonHelpers.getOnlineProductsByCategory(
            site.current.getCustomPreferenceValue('greetingCardCategoryName')
        )
    );
}

/**
 * Cart-Show : The Cart-Show endpoint,
 * This appand will use for
 * 1. Set isGiftWrapEnable according to custom preference
 * 2. Show Gift Wrap Products
 * Cart-Show : The Cart-Show endpoint
 * @name Cart-Show
 */
server.append(
    'Show',
    function (req, res, next) {
        var viewData = res.getViewData();
        viewData.isGreetingCardEnable = site.current.getCustomPreferenceValue(
            'isGreetingCardEnable'
        );

        if (viewData.items.length > 0) {
            if (viewData.isGreetingCardEnable) {
                viewData.greetingCardMessageLimit =
                    site.current.getCustomPreferenceValue('greetingCardMessageLimit');
                viewData.greetingCardProducts = getGreetingCardProducts();
                viewData.isGiftWrapEnable =
                    site.current.getCustomPreferenceValue('isGiftWrapEnable');
            }
            if (viewData.isGiftWrapEnable) {
                var wrappableProducts = [];
                viewData.items.forEach(function(element) {
                    if (element.isGiftWrappable) {
                        wrappableProducts.push(element);
                    }
                });
                if (wrappableProducts.length === 0) {
                    viewData.isGiftWrapEnable = false;
                } else {
                    viewData.wrapItemMethod =
                        site.current.getCustomPreferenceValue(
                            'wrapItemMethod'
                        ).value;
                    viewData.giftWrapProducts = getGiftWrapProducts();
                    viewData.isDisableTogetherOption =
                        viewData.items.length !== wrappableProducts.length;
                    viewData.isDisableIndividualOption =
                        viewData.items.length === 1 &&
                        viewData.items[0].quantity === 1;
                    viewData.wrappableProducts = wrappableProducts;
                }
            }
        }
        res.setViewData(viewData);
        next();
    },
    pageMetaData.computedPageMetaData
);

/**
 * Cart-AddProduct : The Cart-RemoveProductLineItem endpoint removes a product line item from the basket
 * @name Cart-AddProduct
 */
server.prepend('AddProduct', function (req, res, next) {
    var giftWrapCategoryName = site.current.getCustomPreferenceValue(
        'giftWrapCategoryName'
    );
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }
    var giftWrapProductLineItem = getProductLineItemByCategory(
        currentBasket.getAllProductLineItems(),
        giftWrapCategoryName
    );
    if (giftWrapProductLineItem) {
        var product = productMgr.getProduct(req.form.pid);
        if (!product) {
            return 'error';
        }
        var isGiftWrapProduct = commonHelpers.isCategoryMatches(
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
    return next();
});

/**
 * Cart-AddProduct : The Cart-MiniCart endpoint is responsible for displaying the cart icon in the header with the number of items in the current basket
 * @name Cart-AddProduct
 */
server.append('AddProduct', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentOrNewBasket();

    var greetingCardCategoryName = site.current.getCustomPreferenceValue(
        'greetingCardCategoryName'
    );
    if (req.form.greetingCardMessage) {
        var greetingCardMessage = req.form.greetingCardMessage;
        var productLineItemArray = currentBasket.getAllProductLineItems().toArray();
        Transaction.wrap(function () {
            for (var i = 0; i < productLineItemArray.length; i++) {
                var pli = productLineItemArray[i];
                if (pli.product && pli.product.categories.length > 0) {
                    if (
                        commonHelpers.isCategoryMatches(
                            pli.product,
                            greetingCardCategoryName
                        )
                    ) {
                        pli.custom.greetingCardMessage = greetingCardMessage;
                    }
                }
            }
        });
    }

    var giftWrapProduct = null;
    var giftWrapCategoryName = site.current.getCustomPreferenceValue(
        'giftWrapCategoryName'
    );
    var giftWrapProductLineItem = getProductLineItemByCategory(
        currentBasket.getAllProductLineItems(),
        giftWrapCategoryName
    );

    if (giftWrapProductLineItem) {
        giftWrapProduct = giftWrapProductLineItem.productID;
    }
    var productLineItems = currentBasket.getAllProductLineItems().toArray();
    if (
        req.form.toBeIndividuallyWrappedPids &&
        req.form.giftWrapType === 'INDIVIDUAL'
    ) {
        var toBeIndividuallyWrappedPids = JSON.parse(
            req.form.toBeIndividuallyWrappedPids
        );
        var pids = {};
        for (var j = 0; j < toBeIndividuallyWrappedPids.length; j++) {
            if (toBeIndividuallyWrappedPids[toBeIndividuallyWrappedPids[j]]) {
                var i =
                    toBeIndividuallyWrappedPids[toBeIndividuallyWrappedPids[j]];
                pids[i] = (pids[i] || 0) + 1;
            }
        }
        Transaction.wrap(function () {
            for (var k = 0; k < productLineItems.length; k++) {
                var pli = productLineItems[k];
                if (pli.productID !== giftWrapProduct) {
                    if (pids[pli.productID]) {
                        pli.custom.isWrapped = true;
                        pli.custom.wrappedQuantity = pids[pli.productID];
                    } else {
                        pli.custom.isWrapped = false;
                        pli.custom.wrappedQuantity = 0;
                    }
                }
            }
        });
    } else if (req.form.giftWrapType === 'TOGETHER') {
        Transaction.wrap(function () {
            for (var l = 0; l < productLineItems.length; l++) {
                var pli = productLineItems[l];
                if (
                    pli.product.custom.isGiftWrappable &&
                    pli.productID !== giftWrapProduct
                ) {
                    pli.custom.isWrapped = true;
                    pli.custom.wrappedQuantity = 0;
                }
            }
        });
    }

    next();
});

/**
 *
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems : Product line items
 * @returns {number} : Count of wrappable items from Product line items
 */
function getWrappableProductCount(productLineItems) {
    var count = 0;
    collections.forEach(productLineItems, function(productLineItem) {
        if (productLineItem.product.custom.isGiftWrappable) {
            count++;
        }
    });
    return count;
}
/**
 * Cart-RemoveProductLineItem : The Cart-RemoveProductLineItem endpoint removes a product line item from the basket
 * @name Cart-RemoveProductLineItem
 */
server.prepend('RemoveProductLineItem', function (req, res, next) {

    var giftWrapCategoryName = site.current.getCustomPreferenceValue(
        'giftWrapCategoryName'
    );
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }
    if (req.querystring.pid && req.querystring.uuid) {
        var giftWrapProductLineItem = getProductLineItemByCategory(
            currentBasket.getAllProductLineItems(),
            giftWrapCategoryName
        );
        if (giftWrapProductLineItem) {
            // If removed product is GiftWrapCategoryProduct than reset gift wrap attribute
            Transaction.wrap(function () {
                if (giftWrapProductLineItem.product.ID === req.querystring.pid) {
                    var productLineItems = currentBasket.getProductLineItems().toArray();
                    for (var j = 0; j < productLineItems.length; j++) {
                        var pli = productLineItems[j];
                        pli.custom.isWrapped = false;
                        pli.custom.wrappedQuantity = 0;
                    }
                } else {
                    var base = require('app_storefront_base/cartridge/scripts/cart/cartHelpers');
                    var product = productMgr.getProduct(req.querystring.pid);
                    var productInCart = base.getExistingProductLineItemInCart(
                        product,
                        req.querystring.pid,
                        currentBasket.productLineItems
                    );
                    // If wrappable product
                    // Than check is wrapped
                    if (
                        product.custom.isGiftWrappable &&
                        productInCart.custom.isWrapped
                    ) {
                        // Get total wrappable items
                        var productLineItemCount = getWrappableProductCount(
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
    return next();
});

/**
 * Cart-UpdateQuantity : The Cart-UpdateQuantity endpoint handles updating the quantity of a product line item in the basket
 * @name Cart-UpdateQuantity
 */
server.prepend('UpdateQuantity', function (req, res, next) {

    var giftWrapCategoryName = site.current.getCustomPreferenceValue(
        'giftWrapCategoryName'
    );
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }
    if (req.querystring.pid && req.querystring.uuid) {
        var giftWrapProductLineItem = getProductLineItemByCategory(
            currentBasket.getAllProductLineItems(),
            giftWrapCategoryName
        );
        if (giftWrapProductLineItem) {
            if (giftWrapProductLineItem.product.ID === req.querystring.pid) {
                res.setStatusCode(500);
                res.json({
                    error: true,
                    errorMessage:
                        'You can not update quantity of gift wrap product.'
                });
                return this.emit('route:Complete', req, res);
            }
            var product = productMgr.getProduct(req.querystring.pid);
            var base = require('app_storefront_base/cartridge/scripts/cart/cartHelpers');
            var productInCart = base.getExistingProductLineItemInCart(
                product,
                req.querystring.pid,
                currentBasket.productLineItems
            );
            Transaction.wrap(function () {
                // If wrappable product
                // Than check is wrapped
                if (
                    product.custom.isGiftWrappable &&
                    productInCart.custom.isWrapped
                ) {
                    if (productInCart.custom.wrappedQuantity > 0) {
                        //  Update Quantity of giftWrapped category product
                        if (
                            productInCart.custom.wrappedQuantity >
                            req.querystring.quantity
                        ) {
                            if (
                                giftWrapProductLineItem.quantityValue >
                                productInCart.custom.wrappedQuantity -
                                    req.querystring.quantity
                            ) {
                                giftWrapProductLineItem.setQuantityValue(
                                    giftWrapProductLineItem.quantityValue -
                                        (productInCart.custom.wrappedQuantity -
                                            req.querystring.quantity)
                                );
                            } else {
                                res.setStatusCode(500);
                                res.json({
                                    error: true,
                                    errorMessage:
                                        'Gift wrap quantity can not be less than wrappable product quantity.'
                                });

                                this.emit('route:Complete', req, res);
                                return;
                            }
                            productInCart.custom.wrappedQuantity = Number(
                                req.querystring.quantity
                            );
                        }
                    }
                }
            });
        }
    }
    return next();
});

module.exports = server.exports();
