'use strict';

/**
 * prepareEmrasysData function is responsible to prepare the Emrasys  transactional request
 * @param  {object} orderData order data
 * @param userEmail
 * @param pagecat
 * @param ecom
 * @returns {object} Emarsys Data
 */
function prepareEmrasysData(userEmail,pagecat, ecom) {
    var Site = require('dw/system/Site');
    var BasketMgr = require('dw/order/BasketMgr');

    var currentBasket = BasketMgr.getCurrentBasket();
    var productLineItems =
        currentBasket && currentBasket.allProductLineItems.length
            ? currentBasket.allProductLineItems
            : '';
    var products = [];
    if (productLineItems.length > 0) {
        for (var i = 0; i < productLineItems.length; i++) {
            var item = productLineItems[i];
            var productArray = {
                item: item.productID,
                price:
                    item.price && item.price.value
                        ? item.price.value * item.quantityValue * Site.getCurrent().getCustomPreferenceValue('currentCurrencyToMyrConversionRate')
                        : 0,
                quantity: item.quantityValue
            };
            products.push(productArray);
        }
    }
    var cartcontent = products;

    return {
        cartcontent: cartcontent,
        pagecat: pagecat,
        email: userEmail,
        emarsys_purchase_command: '',
        ecom: ecom
    };
}

/**
 * prepareEmrasysOrderData function is responsible to prepare the Emrasys data obj 
 * @param  {object} orderData order data
 * @returns {object} Emrasys data obj 
 */
function prepareEmrasysOrderData(orderData) {
    var products = [];

    if (orderData.items.items.length > 0) {
        for (var i = 0; i < orderData.items.items.length; i++) {
            var item = orderData.items.items[i];
            var productArray = {
                id: item.id,
                item: item.productName,
                price: item.price && item.price.value ? ( item.price.value * item.quantity ) : 0,
                quantity: item.quantity
            };
            products.push(productArray);
        }
    }

    var cartcontent = [];
    var emarsysPurchaseCommand = {};
    emarsysPurchaseCommand.orderId = orderData.orderNumber;
    emarsysPurchaseCommand.items = products;

    return {
        pagecat: 'orderConfirm',
        emarsys_purchase_command: emarsysPurchaseCommand,
        email: orderData.orderEmail,
        cartcontent: cartcontent,
        ecom: ''
    };
}

module.exports = {
    prepareEmrasysData: prepareEmrasysData,
    prepareEmrasysOrderData: prepareEmrasysOrderData
};
