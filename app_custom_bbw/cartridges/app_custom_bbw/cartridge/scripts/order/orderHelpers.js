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

/**
 * Validates
 * @param {string} orderNumber - Order number from form
 * @param {string} orderEmail - Email from form
 * @param {string} billingZipCode - Billing ZIP Code from form
 * @returns {boolean} - value which indicate that entered DOB is valid or not
 */
function validateTrackingData(orderNumber, orderEmail, billingZipCode) {
    var Resource = require('dw/web/Resource');
    var pattern = /^[\w.%+-]+@[\w.-]+\.\w{2,}$/i;
    var error = [];
    if (!orderNumber) {
        error.push({
            key: 'orderNumber',
            message: Resource.msg('error.order.number.required', 'order', null)
        });
    }
    if (!orderEmail) {
        error.push({
            key: 'orderEmail',
            message: Resource.msg('error.order.email.required', 'order', null)
        });
    } else if (!pattern.test(orderEmail)) {
        error.push({
            key: 'orderEmail',
            message: Resource.msg('error.order.email.format', 'order', null)
        });
    }
    if (!billingZipCode) {
        error.push({
            key: 'billingZipCode',
            message: Resource.msg('error.billing.zip.code.required', 'order', null)
        });
    } else if (billingZipCode.length > 10) {
        error.push({
            key: 'billingZipCode',
            message: Resource.msg('error.billing.zip.code.maxlength', 'order', null)
        });
    }

    return error;
}

module.exports = {
    validateTrackingData: validateTrackingData,
    getOrderDetailsByID: getOrderDetailsByID
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
