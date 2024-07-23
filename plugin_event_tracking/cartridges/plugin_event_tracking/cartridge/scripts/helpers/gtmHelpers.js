/* eslint-disable camelcase */

'use strict';

var gtmEvents = require('*/cartridge/config/gtmEvents');
var ProductMgr = require('dw/catalog/ProductMgr');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var getAllBreadcrumbs = require('*/cartridge/scripts/helpers/productHelpers').getAllBreadcrumbs;

var gtmEnabled =
    Site.getCurrent().getCustomPreferenceValue('gtmScriptEnabled') || false;

var orderStatusMatrix = {
    0: 'Payment Pending',
    3: 'Placed Payment Successful',
    4: 'Placed Payment Successful',
    8: 'Order Failed',
    6: 'Order Cancelled',
    5: 'Order Completed'
};

function getProratedPrice(order, UUID) {
    var proratedPrice = 0;
    for (var index = 0; index < order.allProductLineItems.length; index++) {
        var product = order.allProductLineItems[index];
        if (product.UUID === UUID) {
            proratedPrice = (product.proratedPrice.value / product.quantityValue).toFixed(2);
            break;
        }
    }
    return proratedPrice;
}

/**
 * @param {object} res - current route response object
 * @returns {object} an object of containing customer data
 */
function getCustomerData(res) {
    var system = require('dw/system/System');
    var customer = res.currentCustomer.raw;
    var profile = customer.profile;
    var session = request.session;
    var customerObject = {};

    customerObject.environment = (system.getInstanceType() === system.PRODUCTION_SYSTEM ? 'production' : 'development');
    customerObject.demandwareID = customer.ID;
    customerObject.loggedInState = customer.authenticated;
    customerObject.pageLanguage = request.httpLocale;
    customerObject.registered = customer.registered;

    if (customer.registered && profile !== null) {
        customerObject.email = profile.email.toLowerCase();
        customerObject.emailHash = dw.crypto.Encoding.toHex(new dw.crypto.MessageDigest('SHA-256').digestBytes(new dw.util.Bytes(profile.email.toLowerCase())));
        customerObject.user_id = profile.getCustomerNo();
    } else {
        var email = (session.custom.email === null) ? '' : session.custom.email;
        var emailHash = (session.custom.emailHash === null) ? '' : session.custom.emailHash;
        customerObject.email = email;
        customerObject.emailHash = emailHash;
        customerObject.user_id = '';
    }

    return customerObject;
}

/**
 * @returns {object} an object of containing home page data
 */
function getHomeData() {
    var obj = {
        'event': 'home'
    };
    return obj;
}

/**
 *
 * @param {object} res - Response object.
 * @returns {object} obj - returns object with gtm event information
 */
function logIn(res) {
    var obj;
    if (res.success) {
        obj = {
            'event': gtmEvents.LOGIN,
            'method' : 'Site',
            'ecommerce': {
                'firstname': res.authenticatedCustomer.profile.firstName,
                'lastname': res.authenticatedCustomer.profile.lastName,
                'email': res.authenticatedCustomer.profile.email,
                'customer_id': res.authenticatedCustomer.profile.customerNo
            }
        };
    } else{
        obj = {
            event: gtmEvents.SIGN_IN_FAILURE,
            error: 'error' in res ? res.error[0] : ''
        };
    }
    
    return obj;
}

/**
 *
/**
 * @param {object} product - An instance of a product
 *	@returns {object} Object containing product data
 */
function getProductObject(product) {
    var obj = {};
    obj.item_id = product.getID();
    var master = product.variationModel.master;
    obj.item_name = product.getName();

    if (product.primaryCategory !== null) {
        obj.item_category = product.primaryCategory.displayName;
    } else if (master && master.primaryCategory !== null) {
        obj.item_category = master.primaryCategory.displayName;
    }
    if (product.priceModel.maxPrice.valueOrNull !== null) {
        obj.price = product.priceModel.maxPrice.value.toFixed(2);
    }

    return obj;
};
/**
 * @param {object} productLineItem - a product line item
 * @returns {object} an object containing order product data
 */
function getGA4OrderProductObject(productLineItem) {
    var obj = module.exports.getGA4ProductObject(productLineItem.getProduct());
    obj.quantity = productLineItem.getQuantityValue();
    return obj;
}
/**
 * @param {dw.util.Iterator} productList - Iterator composed of Products, ProductListItems, or ProductLineItems
 * @param {Function} callback - Callback that constructs the object that will be added to the returned Array
 * @returns {Array} an array containing product data
 */
function getProductArrayFromList(productList, callback) {

    var productArray = [];

    while (productList.hasNext()) {
        var item = productList.next();
        var prodObj = {};

        if (item instanceof dw.catalog.Product || item instanceof dw.catalog.Variant) {
            prodObj = callback(item);
            prodObj.item_list_id = 'search_results';
            prodObj.item_list_name = 'Search Results';

        } else if (item instanceof dw.customer.ProductListItem || item instanceof dw.order.ProductLineItem) {
            prodObj = callback(item);
        }
        productArray.push(prodObj);
    }
    return productArray;
}
/**
 * @param {object} res - current route response object
 * @returns {object} an object of containing pdp data
 */
function getPdpData(res) {
    var obj = {
        event: gtmEvents.PRODUCT_SHOW,
        ecommerce: {
            currency: res.product.price.sales.currency,
            value: res.product.price.sales.value,
            items:[]
        }
    };

    if ('breadcrumbs' in res && 'product' in res) {
        var category=[];
        for(var i= 0;i<res.breadcrumbs.length; i++){
            category[i]=res.breadcrumbs[i].htmlValue;
        }
        obj.ecommerce.items.push({
            item_name: res.product.gtmData.item_name,
            item_id: res.product.gtmData.item_id,
            discount: res.product.tierPrice ? (res.product.tierPrice - res.product.price.sales.decimalPrice).toFixed(2) : '',
            item_category: category[1] || '',
            item_category2: category[2] || '',
            item_category3: category[3] || '',
            item_category4: category[4] || '',
            price: res.product.price.sales.decimalPrice,
            quantity: 1
        });
    }
    return obj;
}

// view Cart

/**
 *
 * @returns {object} obj - an object of containing cart data
 */
function viewCart() {
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();

    if (currentBasket !== null) {
        var obj = {
            'event': 'view_cart',
            'ecommerce': {
                'currency': currentBasket.currencyCode,
                'value': currentBasket.totalGrossPrice.value.toFixed(2),
                'items': []
            }
        };
        for (var i = 0; i < currentBasket.productLineItems.length; i++) {
            var product = currentBasket.productLineItems[i];
            obj.ecommerce.items.push({
                item_name: product.productName,
                item_id: product.productID,
                item_brand: product.product.brand ? product.product.brand : '',
                discount: product.basePrice && product.adjustedGrossPrice ? (product.basePrice.value - product.adjustedGrossPrice.value).toFixed(2): '',
                item_category: product.category ? product.category : '',
                quantity: product.quantity.value,
                price: product.adjustedGrossPrice.value
            });
        }
        return obj;

    }

    return {};
}
/**
 *
 * @param {object} res - current route response object
 * @returns {object} obj - an object of containing product data
 */
function addToCart(res) {
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();
    var pliUuid = res.pliUUID;
    var lineItem;
    var obj = [];

    if (currentBasket !== null) {
        
        for (var i = 0; i < res.cart.items.length; i++) {
            if (res.cart.items[i].UUID === pliUuid) {
                lineItem = res.cart.items[i];
                break;
            }
        }
        var breadcrumbs = getAllBreadcrumbs(false, lineItem.id, []).reverse();
        obj.push({
            item_name: lineItem.productName,
            item_id: lineItem.id,
            discount: lineItem.tierPrice
                ? (lineItem.tierPrice - lineItem.price.sales.value).toFixed(2)
                : '',
            item_brand: lineItem.brand ? lineItem.brand : '',
            item_category: breadcrumbs[1] ? breadcrumbs[1].htmlValue : '',
            item_category2: breadcrumbs[2] ? breadcrumbs[2].htmlValue : '',
            item_category3: breadcrumbs[3] ? breadcrumbs[3].htmlValue : '',
            item_category4: breadcrumbs[4] ? breadcrumbs[4].htmlValue : '',
            item_category5: breadcrumbs[5] ? breadcrumbs[5].htmlValue : '',
            price: lineItem.price.sales.decimalPrice
                ? lineItem.price.sales.decimalPrice
                : '',
            quantity: lineItem.quantity
        });


    }
    var object = {
        event: gtmEvents.ADD_TO_CART,
        ecommerce: {
            currency: currentBasket.currencyCode,
            value: obj.length && obj[0].price,
            items: obj,
            item_name: obj.length && obj[0].item_name
        }
    };
    return object;
   

}


/**
 *
 * @param {object} res - current route response object
 * @returns {object} obj - an object of containing product data
 */
function removeFromCart(res) {
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();
    var lineItem=res.itemToRemove;
    var breadcrumbs = getAllBreadcrumbs(lineItem.category, lineItem.category ? null : lineItem.productID, []).reverse();
    var obj = [];
    obj.push({
        item_name: lineItem.productName,
        item_id: lineItem.productID,
        discount:
            lineItem.product.priceModel.price.value && res.itemPrice
                ? (
                      lineItem.product.priceModel.price.value -
                      res.proratedPrice
                  ).toFixed(2)
                : '',
        item_brand: lineItem.product.brand ? lineItem.product.brand : '',
        item_category: breadcrumbs[1] ? breadcrumbs[1].htmlValue : '',
        item_category2: breadcrumbs[2] ? breadcrumbs[2].htmlValue : '',
        item_category3: breadcrumbs[3] ? breadcrumbs[3].htmlValue : '',
        item_category4: breadcrumbs[4] ? breadcrumbs[4].htmlValue : '',
        item_category5: breadcrumbs[5] ? breadcrumbs[5].htmlValue : '',
        quantity: lineItem.quantity.value,
        price: res.proratedPrice
    });
    var object = {
        event: gtmEvents.REMOVE_PRODUCT_LINE_ITEM_FROM_CART,
        ecommerce: {
            items: obj,
            currency: currentBasket.currencyCode,
            value: obj[0].price * obj[0].quantity
        }
    };
    return object;
}



// remove from cart
/**
 *
 * @param {object} res - current route response object
 * @returns {object} ecommerce - an object of containing data of to be removed product 
 */
function addToWishlist(res) {
    var pid = res.pid;
    var productData = ProductMgr.getProduct(pid);
    var breadcrumbs = getAllBreadcrumbs(false, productData.ID, []).reverse();
    var obj = {
        event: gtmEvents.ADD_TO_WISHLIST,
        ecommerce: {
            currency: productData.priceModel.price.currencyCode,
            value: productData.priceModel.price.value,
            items: [{
                item_id: pid,
                item_name: productData.name,
                item_brand: productData.brand ? productData.brand : '',
                item_category: breadcrumbs[1] ? breadcrumbs[1].htmlValue : '',
                item_category2: breadcrumbs[2] ? breadcrumbs[2].htmlValue : '',
                item_category3: breadcrumbs[3] ? breadcrumbs[3].htmlValue : '',
                item_category4: breadcrumbs[4] ? breadcrumbs[4].htmlValue : '',
                item_category5: breadcrumbs[5] ? breadcrumbs[5].htmlValue : '',
                price: productData.priceModel.price.value,
                quantity:1
            }]
        }
    };
    return obj;
}

/**
 * @param {object} res - current route response object
 * @returns {object} an object containing a product list
 */
function getSearchProducts(res) {

    var products = new dw.util.ArrayList();
    if ('productSearch' in res) {
        for (var i = 0; i < res.productSearch.productIds.length; i++) {
            var product = ProductMgr.getProduct(res.productSearch.productIds[i].productID);
            products.add1(product);
        }
    }
    return products;
}

/**
 * @param {object} res - current route response object
 * @returns {object} Object containing search impression data.
 */
function getSearchImpressionData(res) {
    var obj;
    if (!res.queryString.includes('cgid')) {
        obj = {
            event: gtmEvents.PRODUCT_SEARCH,
            ecommerce: {
                items: []
            }
        };
        if ('productSearch' in res) {
            obj.ecommerce.items.push({
                search_term: res.productSearch.searchKeywords,
            });
        }
    } else {
        obj = {
            event: gtmEvents.SEARCH_SHOW,
            ecommerce: {
                items: getProductArrayFromList(
                    getSearchProducts(res).iterator(),
                    getProductObject
                )
            }
        };

        if ('productSearch' in res) {
            for (var i = 0; i < res.productSearch.category.length; i++) {
                obj.ecommerce.items.push({
                    category: res.productSearch.category.displayName
                        ? res.productSearch.category.displayName
                        : ''
                });
            }
        }
    }
    return obj;
}

/**
 * @returns {object} Object containing checkout data.
 */
function getCheckoutData() {
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();
    var obj = {};
    if (currentBasket !== null) {
        obj = {
            event:  gtmEvents.BEGIN_CHECKOUT,
            ecommerce: {
                currency: currentBasket.currencyCode,
                value: currentBasket
                    .totalGrossPrice
                    .value.toFixed(2),
                coupon: currentBasket.couponLineItems.length > 0 ? currentBasket.couponLineItems[0].couponCode : '',
                items: [],
            }
        };
        for (var i = 0; i < currentBasket.productLineItems.length; i++) {
            var product = currentBasket.productLineItems[i];
            var breadcrumbs = getAllBreadcrumbs(false, product.productID, []).reverse();
            obj.ecommerce.items.push({
                item_name: product.productName,
                item_id: product.productID,
                item_brand: product.product.brand ? product.product.brand : '',
                discount:
                    product.basePrice && product.adjustedGrossPrice
                        ? (
                              product.basePrice.value -
                              product.proratedPrice.value /
                                  product.quantityValue
                          ).toFixed(2)
                        : '',
                item_category: breadcrumbs[1] ? breadcrumbs[1].htmlValue : '',
                item_category2: breadcrumbs[2] ? breadcrumbs[2].htmlValue : '',
                item_category3: breadcrumbs[3] ? breadcrumbs[3].htmlValue : '',
                item_category4: breadcrumbs[4] ? breadcrumbs[4].htmlValue : '',
                item_category5: breadcrumbs[5] ? breadcrumbs[5].htmlValue : '',
                quantity: product.quantity.value,
                price: (
                    product.proratedPrice.value / product.quantityValue
                ).toFixed(2)
            });
        }
    }
    return obj;
}
/**
 * @param {object} res - current route response object
 * @returns {object} Object containing SHIPPING data.
 */
function addShipping(res) {
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();

    if (currentBasket !== null) {
        var obj = {
            event: 'add_shipping_info',
            ecommerce: {
                currency: currentBasket.currencyCode,
                value: currentBasket.totalGrossPrice.value.toFixed(2),
                shipping_tier: res.shippingMethod,
                coupon: currentBasket.couponLineItems.length > 0 ? currentBasket
                    .couponLineItems[0].couponCode : null,
                items: []
            }
        };
        if ('order' in res) {
            for (var i = 0; i < res.order.items.items.length; i++) {
                var breadcrumbs = getAllBreadcrumbs(false, res.order.items.items[i].id, []).reverse();
                obj.ecommerce.items.push({
                    item_name: res.order.items.items[i].productName,
                    item_id: res.order.items.items[i].id,
                    item_brand: res.order.items.items[i].brand ? res.order.items.items[i].brand:'' ,
                    item_category: breadcrumbs[1] ? breadcrumbs[1].htmlValue : '',
                    item_category2: breadcrumbs[2] ? breadcrumbs[2].htmlValue : '',
                    item_category3: breadcrumbs[3] ? breadcrumbs[3].htmlValue : '',
                    item_category4: breadcrumbs[4] ? breadcrumbs[4].htmlValue : '',
                    item_category5: breadcrumbs[5] ? breadcrumbs[5].htmlValue : '',
                    price: getProratedPrice(currentBasket,res.order.items.items[i].UUID),
                    quantity: res.order.items.items[i].quantity,
                });
            }
        }
        return obj;

    }
    return {};
}

/**
 * @param {object} res - current route response object
 * @returns {object} Object containing payment data.
 */
function addPayment(res) {
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();

    if (currentBasket !== null) {
        var paymentMethod = currentBasket.paymentInstrument.paymentMethod;
        if (paymentMethod === 'AdyenComponent') {
            paymentMethod =
                currentBasket.paymentInstrument.custom &&
                currentBasket.paymentInstrument.custom.adyen_payment__Adyen_Payment_Method;
        }
        var obj = {
            event: gtmEvents.ADD_PAYMENT_INFO,
            ecommerce: {
                currency: currentBasket.currencyCode,
                value: currentBasket.totalGrossPrice.value.toFixed(2),
                payment_type: paymentMethod,
                coupon: currentBasket.couponLineItems.length > 0 ? currentBasket.couponLineItems[0].couponCode : '',
                items: []
            }
        };
        if ('order' in res) {
            for (var i = 0; i < res.order.items.items.length; i++) {
                var breadcrumbs = getAllBreadcrumbs(false, res.order.items.items[i].id, []).reverse();
                obj.ecommerce.items.push({
                    item_name: res.order.items.items[i].productName,
                    item_id: res.order.items.items[i].id,
                    item_brand: res.order.items.items[i].brand
                        ? res.order.items.items[i].brand
                        : '',
                    item_category: breadcrumbs[1] ? breadcrumbs[1].htmlValue : '',
                    item_category2: breadcrumbs[2] ? breadcrumbs[2].htmlValue : '',
                    item_category3: breadcrumbs[3] ? breadcrumbs[3].htmlValue : '',
                    item_category4: breadcrumbs[4] ? breadcrumbs[4].htmlValue : '',
                    item_category5: breadcrumbs[5] ? breadcrumbs[5].htmlValue : '',
                    price: getProratedPrice(currentBasket,res.order.items.items[i].UUID),
                    quantity: res.order.items.items[i].quantity
                });
            }

        }
        return obj;
    }
    return {};
}

/**
 * @param {object} res - current route response object
 * @returns {object} Object containing confirmation page data.
 */
function getConfirmationData(res) {
    var order = null;
    var obj = {};
    try {
        order = dw.order.OrderMgr.getOrder(res.order.orderNumber);
    } catch (e) {
        Logger.error('GTMHelpers - cannot retrieve order: '.concat(e));
    }

    try {
        obj = {
            event: gtmEvents.PURCHASE,
            ecommerce: {
                transaction_id: order.orderNo,
                value: order.totalGrossPrice.value.toFixed(2),
                tax: order.getTotalTax().getValue().toFixed(2),
                shipping: order.getAdjustedShippingTotalPrice().getValue(),
                coupon: order.couponLineItems.length ? order.couponLineItems[0].couponCode : '',
                currency: order.currencyCode,
                orderStatus: orderStatusMatrix[order.status.value],
                items: []
            }
        };
        if ('order' in res) {
            for (var i = 0; i < res.order.items.items.length; i++) {
                var breadcrumbs = getAllBreadcrumbs(res.order.items.items[i].gtmData.item_category, res.order.items.items[i].id, []).reverse();
                var proratedPrice = getProratedPrice(order, res.order.items.items[i].UUID);
                obj.ecommerce.items.push({
                    item_name: res.order.items.items[i].productName,
                    item_id: res.order.items.items[i].id,
                    item_brand: res.order.items.items[i].brand
                        ? res.order.items.items[i].brand
                        : '',
                    // coupon:res.order.totals.discounts[i].couponCode,
                    item_category: breadcrumbs[1] ? breadcrumbs[1].htmlValue : '',
                    item_category2: breadcrumbs[2] ? breadcrumbs[2].htmlValue : '',
                    item_category3: breadcrumbs[3] ? breadcrumbs[3].htmlValue : '',
                    item_category4: breadcrumbs[4] ? breadcrumbs[4].htmlValue : '',
                    item_category5: breadcrumbs[5] ? breadcrumbs[5].htmlValue : '',
                    price: proratedPrice,
                    discount: res.order.items.items[i].basePrice.valueOrNull
                        ? (
                              res.order.items.items[i].basePrice.value -
                              proratedPrice
                          ).toFixed(2)
                        : 0,
                    quantity: res.order.items.items[i].quantity
                });
            }
        }
    } catch (e) {
        Logger.error('GTMHelpers - Error in creating oject: '.concat(e));
        return {};
    }
    return obj;
}

/**
 * @param {object} res - current route response object
 * @returns {object} Object containing signup data.
 */
function signUp(res) {
    if (res.success) {
        var obj = {
            event: gtmEvents.SIGN_UP,
            method: 'Site'
        };
        return obj;
    }
    return {};
}

/**
 * @param {object} res - current route response object
 * @returns {object} Object containing order check failure data.
 */
function getOrderCheckData(res) {
    if (res.error) {
        var obj = {
            event: gtmEvents.ORDER_CHCEK_FAILURE
        };
        return obj;
    }
    return {};
}


// eslint-disable-next-line jsdoc/require-returns-check
/**
 * @param {object} res - current route response object
 * @returns {object} Object containing gtm data corresponding to the controller.
 */
function getDataLayer(res) {
    try {
        switch (res.action) {
            case 'Home-Show':
            case 'Default-Start':
                return getHomeData();
            case 'Account-Login':
                return logIn(res);
            case 'Account-SubmitRegistration':
                return signUp(res);
            case 'Product-Show':
                return getPdpData(res);
            case 'Search-Show':
                return getSearchImpressionData(res);
            case 'Cart-Show':
                return viewCart(res);
            case 'Cart-AddProduct':
                if (!res.error) {
                    return addToCart(res);
                }
                break;
            case 'Cart-RemoveProductLineItem':
                return removeFromCart(res);
            case 'Wishlist-AddProduct':
                return addToWishlist(res);
            case 'Checkout-Login':
                return getCheckoutData(2);
            case 'Checkout-Begin':
                return getCheckoutData(res);
            case 'CheckoutShippingServices-SubmitShipping':
                return addShipping(res);
            case 'CheckoutServices-SubmitPayment':
                return addPayment(res);
            case 'Order-Confirm':
                return getConfirmationData(res);
            case 'Order-Check':
                return getOrderCheckData(res);
            default:
                return false;
        }
    } catch (error) {
        Logger.getLogger('GA_GTM', 'GA_GTM').error(
            'Error when triggering GTM event' + error
        );
        return {};
    }
    return {};

}

module.exports = {
    isEnabled: gtmEnabled,
    getDataLayer: getDataLayer,
    getProductObject: getProductObject,
    getCustomerData: getCustomerData,
    getSearchImpressionData: getSearchImpressionData,
    getConfirmationData: getConfirmationData,
    getGA4OrderProductObject: getGA4OrderProductObject
};
