'use strict';

var gtmEvents = require('*/cartridge/config/gtmEvents');
var ProductMgr = require('dw/catalog/ProductMgr');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

var gtmEnabled =
    Site.getCurrent().getCustomPreferenceValue('googleScriptEnabled') || false;

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
    if (res.queryString.includes('registration=false')) {
        obj = {
            'event': 'login',
            'ecommerce': {
                'firstname': res.CurrentCustomer.profile.firstName,
                'lastname': res.CurrentCustomer.profile.lastName,
                'email': res.CurrentCustomer.profile.email,
                'customer id': res.CurrentCustomer.profile.customerNo
            }
        };
    } else {
        obj = {
            'event': 'sign_up',
            'ecommerce': {
                'firstname': res.CurrentCustomer.profile.firstName,
                'lastname': res.CurrentCustomer.profile.lastName,
                'email': res.CurrentCustomer.profile.email,
                'customer id': res.CurrentCustomer.profile.customerNo
            }
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
        obj.item_categoryID = product.primaryCategory.ID.replace(/_/gi, '/');
    } else if (master && master.primaryCategory !== null) {
        obj.item_category = master.primaryCategory.displayName;
        obj.item_categoryID = master.primaryCategory.ID.replace(/_/gi, '/');
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
    var position = 1;

    while (productList.hasNext()) {
        var item = productList.next();
        var prodObj = {};

        if (item instanceof dw.catalog.Product || item instanceof dw.catalog.Variant) {
            prodObj = callback(item);
            prodObj.position = position;
            prodObj.list = 'Search Results';

        } else if (item instanceof dw.customer.ProductListItem || item instanceof dw.order.ProductLineItem) {
            prodObj = callback(item);
        }
        productArray.push(prodObj);
        position++;
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
            items: []
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
            item_brand: res.product.brand ? res.product.brand :'',
            discount: res.product.tierPrice ? (res.product.tierPrice - res.product.price.sales.decimalPrice).toFixed(2):'',
            item_category :category[0] || '',
            item_category2: category[1] || '',
            item_category3: category[2] || '',
            item_category4: category[3] || '',
            price: res.product.price.sales.decimalPrice,

        });
    }
    return obj;
}

// view Cart

/**
 *
 * @param {object} res - current route response object
 * @returns {object} obj - an object of containing cart data
 */
function viewCart(res) {
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();

    if (currentBasket !== null) {
        var obj = {
            'event': 'view_cart',
            'ecommerce': {
                'currency': currentBasket.currencyCode,
                'value': currentBasket.getAdjustedMerchandizeTotalNetPrice().value.toFixed(2),
                'items': []
            }
        };
        if ('items' in res) {
            for (var i = 0; i < res.items.length; i++) {
                obj.ecommerce.items.push({
                    item_name: res.items[i].productName,
                    item_id: res.items[i].id,
                    item_brand: res.items[i].brand ?  res.items[i].brand:'',
                    discount: res.items[i].tierPrice ?  (res.items[i].tierPrice - res.items[i].price.sales.value).toFixed(2):'',
                    item_category: res.items[i].product ? res.items[i].product:'',
                    item_category2: res.items[i].gtmData.category ? res.cart.items[i].gtmData.category : '',
                    quantity: res.items[i].quantity,
                    price: res.items[i].price.sales.decimalPrice


                });

            }
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
        obj.push({
            item_name: lineItem.productName,
            item_id: lineItem.id,
            discount: lineItem.tierPrice ? (lineItem.tierPrice - lineItem.price.sales.value).toFixed(2):'',
            item_brand: lineItem.brand ? lineItem.brand:'',
            item_category: lineItem.product ? lineItem.product:'',
            price: lineItem.price.sales.decimalPrice ? lineItem.price.sales.decimalPrice : '',
            quantity: lineItem.quantity,
        });


    }
    var object = {
        event: gtmEvents.ADD_TO_CART,
        ecommerce: {
            add: {
                currency: currentBasket.currencyCode,
                value: obj[0].price,
                products: obj,
                item_name: lineItem.productName
            }
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
        obj.push({
            item_name: lineItem.productName,
            item_id: lineItem.id,
            discount: lineItem.tierPrice
                ? (lineItem.tierPrice - lineItem.price.sales.value).toFixed(2)
                : '',
            item_brand: lineItem.brand ? lineItem.brand : '',
            item_category: lineItem.product ? lineItem.product : '',
            price: lineItem.price.sales.decimalPrice
                ? lineItem.price.sales.decimalPrice
                : '',
            quantity: lineItem.quantity
        });
    }
    var object = {
        event: gtmEvents.REMOVE_PRODUCT_LINE_ITEM_FROM_CART,
        ecommerce: {
            remove: {
                products: obj
            },
            add: {
                products: obj
            }
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
    var ecommerce = {

        'event': 'add_to_wishlist',
        'currency': productData.priceModel.price.currencyCode,
        'value': productData.priceModel.price.value,

        'items': {

            'item_id': pid,
            'item_name': productData.name,
            'item_brand': productData.brand ? productData.brand:'',
            'item-category': productData.allCategories[0].displayName ? productData.allCategories[0].displayName:'',
            'item_categoryID': productData.allCategories[0].parent.ID ? productData.allCategories[0].parent.ID:'',
            'price': productData.priceModel.price.value,

        }
    };

    return ecommerce;
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
            'event': 'search',
            'ecommerce': {
                'items': []
            }
        };
        if ('productSearch' in res) {
            obj.ecommerce.items.push({
                search_term: res.productSearch.searchKeywords,
            });
        }
    } else {
        obj = {
            'event': 'view_item_list',
            'ecommerce': {
                'items': getProductArrayFromList((getSearchProducts(res)).iterator(), getProductObject)
            }
        };

        if ('productSearch' in res) {
            for (var i = 0; i < res.productSearch.category.length; i++) {
                obj.ecommerce.items.push({
                    category: res.productSearch.category.displayName ? res.productSearch.category.displayName : '',
                });
            }
        }
    }
    return obj;
}

/**
 * @param {object} res - current route response object
 * @returns {object} Object containing checkout data.
 */
function getCheckoutData(res) {
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();
    var obj;
    if (currentBasket !== null) {
        obj = {
            'event': 'begin_checkout',
            'ecommerce': {
                'checkout': {
                    'currency': currentBasket.currencyCode,
                    'value': currentBasket.getAdjustedMerchandizeTotalNetPrice().value.toFixed(2),
                    'products': []
                }
            }
        };
    }
    if ('order' in res) {
        for (var i = 0; i < res.order.items.items.length; i++) {
            obj.ecommerce.products.push({
                item_name: res.order.items.items[i].productName,
                item_id: res.order.items.items[i].id,
                item_brand: res.order.items.items[i].brand
                    ? res.order.items.items[i].brand
                    : '',
                item_category: res.order.items.items[i].gtmData.item_category
                    ? res.order.items.items[i].gtmData.item_category
                    : '',
                item_categoryID: res.order.items.items[i].gtmData
                    .item_categoryID
                    ? res.order.items.items[i].gtmData.item_categoryID
                    : '',
                price: res.order.items.items[i].price.sales.decimalPrice,
                quantity: res.order.productQuantityTotal
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
            'event': 'add_shipping_info',
            'ecommerce': {
                'currency': currentBasket.currencyCode,
                'value': currentBasket.getAdjustedMerchandizeTotalNetPrice().value.toFixed(2),
                // 'shipping_tier':res.shippingMethod,
                // 'coupon':currentBasket.couponLineItems[0].couponCode,
                'items': []
            }
        };
        if ('order' in res) {
            for (var i = 0; i < res.order.items.items.length; i++) {
                obj.ecommerce.items.push({
                    item_name: res.order.items.items[i].productName,
                    item_id: res.order.items.items[i].id,
                    item_brand: res.order.items.items[i].brand ? res.order.items.items[i].brand:'' ,
                    item_category: res.order.items.items[i].gtmData.item_category ? res.order.items.items[i].gtmData.item_category:'',
                    item_categoryID: res.order.items.items[i].gtmData.item_categoryID ? res.order.items.items[i].gtmData.item_categoryID:'',
                    price: res.order.items.items[i].price.sales.decimalPrice,
                    quantity: res.order.productQuantityTotal,
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
        var obj = {
            event: gtmEvents.ADD_PAYMENT_INFO,
            ecommerce: {
                currency: currentBasket.currencyCode,
                value: currentBasket
                    .getAdjustedMerchandizeTotalNetPrice()
                    .value.toFixed(2),
                payment_type: currentBasket.paymentInstrument.paymentMethod,
                add: {
                    products: []
                }
            }
        };
        if ('order' in res) {
            for (var i = 0; i < res.order.items.items.length; i++) {
                obj.ecommerce.add.products.push({
                    item_name: res.order.items.items[i].productName,
                    item_id: res.order.items.items[i].id,
                    item_brand: res.order.items.items[i].brand
                        ? res.order.items.items[i].brand
                        : '',
                    item_category: res.order.items.items[i].gtmData
                        .item_category
                        ? res.order.items.items[i].gtmData.item_category
                        : '',
                    item_categoryID: res.order.items.items[i].gtmData
                        .item_categoryID
                        ? res.order.items.items[i].gtmData.item_categoryID
                        : '',
                    price: res.order.items.items[i].price.sales.decimalPrice,
                    quantity: res.order.productQuantityTotal
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
    try {
        if ('token' in request.httpParameterMap) {
            order = dw.order.OrderMgr.getOrder(res.order.orderNumber, request.httpParameterMap.token.value);
        } else {
            order = dw.order.OrderMgr.getOrder(res.order.orderNumber);
        }
    } catch (e) {
        Logger.error('GTMHelpers - cannot retrieve order');
    }


    var obj = {
        'event': 'purchase',
        'ecommerce': {
            'currency': order.currencyCode,
            'transaction_id': order.orderNo,
            'value': order.getAdjustedMerchandizeTotalPrice(true).getValue(),
            // 'coupon':order.couponLineItems[0].couponCode,
            'shipping': order.getAdjustedShippingTotalPrice().getValue(),
            'tax': order.getTotalTax().getValue().toFixed(2),
            'total': order.totalNetPrice.value,
            'purchase': {
                'items': []
            }
        }
    };
    if ('order' in res) {
        for (var i = 0; i < res.order.items.items.length; i++) {
            obj.ecommerce.purchase.items.push({
                item_name: res.order.items.items[i].productName,
                item_id: res.order.items.items[i].id,
                item_brand: res.order.items.items[i].brand ? res.order.items.items[i].brand:'' ,
                // coupon:res.order.totals.discounts[i].couponCode,
                item_category: res.order.items.items[i].gtmData.item_category ?  res.order.items.items[i].gtmData.item_category:'',
                item_categoryID: res.order.items.items[i].gtmData.item_categoryID ? res.order.items.items[i].gtmData.item_categoryID:'',
                price: res.order.items.items[i].gtmData.price,
                quantity: res.order.productQuantityTotal,
            });
        }
    }
    return obj;
}
// eslint-disable-next-line jsdoc/require-returns-check
/**
 * @param {object} res - current route response object
 * @returns {object} Object containing gtm data corresponding to the controller.
 */
function getDataLayer(res) {
    switch (res.action) {
        case 'Home-Show':
        case 'Default-Start':
            return getHomeData();
        case 'Account-Show':
            return logIn(res);
        case 'Product-Show':
            return getPdpData(res);
        case 'Search-Show':
            return getSearchImpressionData(res);
        case 'Cart-Show':
            return viewCart(res);
        case 'Cart-AddProduct':
            return addToCart(res);
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
        default:
            return false;
    };
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
