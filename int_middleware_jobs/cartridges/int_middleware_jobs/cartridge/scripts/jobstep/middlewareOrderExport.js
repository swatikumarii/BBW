'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var model = require('*/cartridge/models/orders');
var Logger = require('dw/system/Logger').getLogger('middlewareOrderExport');

var orderIterator;

exports.beforeStep = function (parameters, stepExecution) {
    if (parameters.exportErrorOrdersOnly) {
        orderIterator = OrderMgr.searchOrders('custom.middlewareExportStatus = {0}', 'creationDate asc', 'error');
    } else if (parameters.allOrdersExport) {
        orderIterator = OrderMgr.searchOrders('orderNo LIKE {0}', 'creationDate asc', parameters.orderPrefix);
    } else {
        var milliDeduction = 1000 * 60 * parameters.minutes; // milliseconds * seconds * minutes;
        var now = new Date();
        now.setTime(now.getTime() - milliDeduction);

        orderIterator = OrderMgr.searchOrders('lastModified > {0}', 'lastModified asc', now);
    }
};

exports.getTotalCount = function (parameters, stepExecution) {
    return orderIterator.count;
};

exports.read = function (parameters, stepExecution) {
    if (orderIterator.hasNext()) {
        return orderIterator.next();
    }
};

exports.process = function (order, parameters, stepExecution) {
    var serviceResponse = model.orderModel(order);
    var responseObj = serviceResponse.object;

    if (responseObj && responseObj.statusCode && responseObj.statusCode === 200) {
        order.custom.middlewareExportStatus = 'success';
        Logger.info('Service response{0}', responseObj.text);
    // } else if (serviceResponse.statusCode === 500) {
    } else {
        order.custom.middlewareExportStatus = 'error';
        order.custom.middlewareExportNotes = JSON.stringify({
            error: serviceResponse.error,
            errorMessage: serviceResponse.errorMessage,
            msg: serviceResponse.msg
        });

        Logger.error('Error while hitting middleware service - orderExportMiddleware.http.post: ', serviceResponse.errorMessage);
    }

    return order;
};

exports.write = function (lines, parameters, stepExecution) {};

exports.afterStep = function (success, parameters, stepExecution) {
    orderIterator.close();
};
