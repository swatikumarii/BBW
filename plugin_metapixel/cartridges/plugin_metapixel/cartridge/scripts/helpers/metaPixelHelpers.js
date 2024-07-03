/* eslint-disable camelcase */

'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

var metaPixelEnabled =
    Site.getCurrent().getCustomPreferenceValue('metaPixelEnabled') || false;

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
 *
 * @param {object} res - current route response object
 * @returns {object} obj - an object of containing product data
 */
function addToCart(res) {
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();
    var pliUuid = res.pliUUID;
    var lineItem;
    var obj = {};

    if (currentBasket !== null) {
        for (var i = 0; i < res.cart.items.length; i++) {
            if (res.cart.items[i].UUID === pliUuid) {
                lineItem = res.cart.items[i];
                break;
            }
        };
        obj.content_name = lineItem.productName;
        obj.content_ids = [lineItem.id];
        obj.content_type = 'product';
        obj.contents = [{'id': lineItem.id, 'quantity': 1}];
        obj.value = lineItem.price.sales.decimalPrice
            ? lineItem.price.sales.decimalPrice
            : '';
        obj.quantity = lineItem.quantity;
        obj.currency = currentBasket.getCurrencyCode();
    }

    var object = {
        event: 'AddToCart',
        data: obj
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
    var obj = {
        event: 'AddToWishlist',
        data: {
            item_id: pid,
            item_name: productData.name,
            item_brand: productData.brand ? productData.brand : '',
            'item-category': productData.allCategories[0].displayName
                ? productData.allCategories[0].displayName
                : '',
            item_categoryID: productData.allCategories[0].parent.ID
                ? productData.allCategories[0].parent.ID
                : '',
            price: productData.priceModel.price.value,
            currency: productData.priceModel.price.currencyCode
        }
    };

    return obj;
}

function queryStringToObject(queryString) {
    queryString = queryString.replace(/^\?/, '');

    var pairs = queryString.split('&');

    var result = {};

    pairs.forEach((pair) => {
        pair = pair.split('=');
        var key = decodeURIComponent(pair[0]);
        var value = decodeURIComponent(pair[1] || '');

        if (result[key]) {
            if (!Array.isArray(result[key])) {
                result[key] = [result[key]];
            }
            result[key].push(value);
        } else {
            result[key] = value;
        }
    });

    return result;
}

/**
 * @param {object} res - current route response object
 * @returns {object} Object containing search impression data.
 */
function getSearchImpressionData(res) {
    var obj;
    if (!res.queryString.includes('cgid')) {
        obj = {
            'event': 'Search',
            'data': {
            }
        };
        if ('productSearch' in res) {
            obj.data.query =res.productSearch.searchKeywords;
        }
    } else {
        obj = {
            event: 'Search',
            data: {}
        };
        var queryObject = queryStringToObject(res.queryString)
        obj.data.cgid = queryObject.cgid;
    }
    return obj;
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
    }
    catch (e) {
        Logger.error('MetaHelpers - cannot retrieve order'+e);
        return obj;
    }
    var contentIds = [];
    var contents = [];
    var num_items=0
    for (var index = 0; index < order.allProductLineItems.length; index++) {
        var product = order.allProductLineItems[index];
        contentIds.push(product.productID);
        contents.push({'id': product.productID, 'quantity' : product.quantityValue});
        num_items += product.quantityValue;
    }


    obj = {
        event: 'Purchase',
        data: {
            content_ids: contentIds,
            content_type: 'product',
            contents:contents,
            currency: order.currencyCode,
            num_items: num_items,
            value: order.totalGrossPrice.value,
            order_id: order.orderNo,
            shipping: order.getAdjustedShippingTotalPrice().getValue(),
            tax: order.getTotalTax().getValue().toFixed(2),
        }
    };
    return obj;
}

/**
 * @param {object} res - current route response object
 * @returns {object} Object containing signup data.
 */
function signUp(res) {
    if (res.success) {
        var obj = {
            event: 'Lead',
            data: {
                email: res.email,
                firstName: res.firstName,
                lastName: res.lastName
            }
        };
        return obj;
    }
    return {};
}

/**
 * @param {object} res - current route response object
 * @returns {object} Object containing stores data.
 */
function getStoresData(res) {
    var obj = {
        event: 'Locator Search',
        data: res.searchKey
    };
    obj.data.noOfStoresFound = res.stores.length;
    return obj;
}
;

/**
 * @param {object} res - current route response object
 * @returns {object} Object containing meta event data corresponding to the controller.
 */
function getFbqData(res) {
    try {
        switch (res.action) {
            case 'Account-SubmitRegistration':
                return signUp(res);
            case 'Search-Show':
                return getSearchImpressionData(res);
            case 'Cart-AddProduct':
                if (!res.error) {
                    return addToCart(res);
                }
                break;
            case 'Wishlist-AddProduct':
                return addToWishlist(res);
            case 'Order-Confirm':
                return getConfirmationData(res);
            case 'Stores-FindStores':
                return getStoresData(res);
            default:
                return {};
        }
    } catch (error) {
        Logger.getLogger('FB_Pixel', 'FB_Pixel').error(
            'Error when triggering FB Pixel event' + error
        );
        return {};
    }
    return {};

}

module.exports = {
    isEnabled: metaPixelEnabled,
    getFbqData: getFbqData,
    getProductObject: getProductObject,
};
