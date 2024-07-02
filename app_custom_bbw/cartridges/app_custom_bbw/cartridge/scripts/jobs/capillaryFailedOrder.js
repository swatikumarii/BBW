'use strict';

// dw imports
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');


/**
 * This function is using to update capillary order failed status
 * @returns {any} Status with ok/error
 */
function execute() {
    try {
        // fetch orders where don't have capillaryOrderID and order starts with bbw and capillary id is null in order object
        var orderList = OrderMgr.queryOrders(
            'orderNo LIKE \'BBW*\' AND custom.capillaryOrderID = null AND custom.capillaryFailed = false', 'lastModified desc' );

        // Loop through the order and process them as needed
        Transaction.wrap(function () {
            while (orderList.hasNext()) {
                var order = orderList.next();
                order.custom.capillaryFailed = true;
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
