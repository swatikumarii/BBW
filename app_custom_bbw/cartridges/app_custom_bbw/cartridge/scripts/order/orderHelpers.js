'use strict';

var base = module.superModule;

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Locale = require('dw/util/Locale');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

var OrderModel = require('*/cartridge/models/order');

/**
 * Returns a list of orders for the current customer
 * @param {object} currentCustomer - object with customer properties
 * @param {object} querystring - querystring properties
 * @param {string} locale - the current request's locale id
 * @returns {object} - orderModel of the current dw order object
 */
function getOrders(currentCustomer, querystring, locale) {
    // get all orders for this user
    var orderHistory = currentCustomer.raw.getOrderHistory();
    var customerOrders = orderHistory.getOrders(
        'status!={0}',
        'creationDate desc',
        Order.ORDER_STATUS_REPLACED
    );

    var orders = [];

    var filterValues = [
        {
            displayValue: Resource.msg('orderhistory.sixmonths.option', 'order', null),
            optionValue: URLUtils.url('Order-Filtered', 'orderFilter', '6').abs().toString()
        },
        {
            displayValue: Resource.msg('orderhistory.twelvemonths.option', 'order', null),
            optionValue: URLUtils.url('Order-Filtered', 'orderFilter', '12').abs().toString()
        }
    ];
    var orderYear;
    var years = [];
    var customerOrder;
    // var SIX_MONTHS_AGO = Date.now() - 15778476000;
    // var YEAR_AGO = Date.now() - 31556952000;
    var orderModel;

    var currentLocale = Locale.getLocale(locale);

    while (customerOrders.hasNext()) {
        customerOrder = customerOrders.next();
        var config = {
            numberOfLineItems: 'single'
        };

        orderYear = customerOrder.getCreationDate().getFullYear().toString();
        // var orderTime = customerOrder.getCreationDate().getTime();

        if (years.indexOf(orderYear) === -1) {
            var optionURL = URLUtils.url('Order-Filtered', 'orderFilter', orderYear).abs().toString();
            filterValues.push({
                displayValue: orderYear,
                optionValue: optionURL
            });
            years.push(orderYear);
        }

        // if (querystring.orderFilter
        //     && querystring.orderFilter !== '12'
        //     && querystring.orderFilter !== '6') {
        //     if (orderYear === querystring.orderFilter) {
        //         orderModel = new OrderModel(
        //             customerOrder,
        //             { config: config, countryCode: currentLocale.country }
        //         );
        //         orders.push(orderModel);
        //     }
        // } else if (querystring.orderFilter
        //     && YEAR_AGO < orderTime
        //     && querystring.orderFilter === '12') {
        //     orderModel = new OrderModel(
        //         customerOrder,
        //         { config: config, countryCode: currentLocale.country }
        //     );
        //     orders.push(orderModel);
        // } else if (SIX_MONTHS_AGO < orderTime) {
        //     orderModel = new OrderModel(
        //         customerOrder,
        //         { config: config, countryCode: currentLocale.country }
        //     );
        //     orders.push(orderModel);
        // }
        orderModel = new OrderModel(customerOrder, {
            config: config,
            countryCode: currentLocale.country
        });
        orders.push(orderModel);
    }

    return {
        orders: orders,
        filterValues: filterValues
    };
}

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
    getOrderDetailsByID: getOrderDetailsByID,
    getOrders: getOrders
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
