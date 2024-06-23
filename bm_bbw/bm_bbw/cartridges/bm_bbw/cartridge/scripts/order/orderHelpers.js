'use strict';

var base = module.superModule;

var OrderMgr = require('dw/order/OrderMgr');
var Locale = require('dw/util/Locale');

var OrderModel = require('*/cartridge/models/order');

/**
 * getOrderDetailsByID Creates an order model for the current customer
 * @param {string} orderID order id
 * @param {string} locale locale id
 * @returns {Array}  an object of the customer's order
 */
function getOrderDetailsByID(orderID, locale) {
    var order = OrderMgr.getOrder(orderID);

    var config = {
        numberOfLineItems: '*'
    };

    var currentLocale = Locale.getLocale(locale);

    var orderModel = new OrderModel(order, {
        config: config,
        countryCode: currentLocale.country
    });

    return orderModel;
}

getOrderDetailsByID.public = true;
exports.getOrderDetailsByID = getOrderDetailsByID;
