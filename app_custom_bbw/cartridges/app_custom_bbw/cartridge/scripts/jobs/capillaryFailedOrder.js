'use strict';

// dw imports
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var logger = require('dw/system/Logger');
var Order = require('dw/order/Order');


/**
 * This function is using to update capillary order failed status
 * @returns {any} Status with ok/error
 */
function execute() {
    try {
        var searchDate = new Date(2024, 5, 25);
        // fetch orders where don't have capillaryOrderID and order starts with bbw and capillary id is null in order object
        var orderList = OrderMgr.searchOrders(
            'custom.capillaryOrderID = null AND custom.capillaryFailed != true AND (status = {0} OR status = {1} OR status = {2}) AND creationDate >= {3}', 'lastModified desc',  Order.ORDER_STATUS_COMPLETED, Order.ORDER_STATUS_OPEN, Order.ORDER_STATUS_NEW, searchDate);

        // Loop through the order and process them as needed
        Transaction.wrap(function () {
            while (orderList.hasNext()) {
                var order = orderList.next();
                order.custom.capillaryFailed = true;
                logger.info('process order '+ order.orderNo);
            }
        });
        return new Status(Status.OK);
    } catch (exception) {
        return new Status(Status.ERROR, null, 'There was an error while executing capillary job step: createOrders');
    }
}
module.exports = {
    execute: execute
};
