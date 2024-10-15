'use strict';

var SystemObjectMgr = require('dw/object/SystemObjectMgr');
var Transaction = require('dw/system/Transaction');
var ProductMgr = require('dw/catalog/ProductMgr');
var CatalogMgr = require('dw/catalog/CatalogMgr');

// Define the job to sync scheduled inventory
function execute() {
    // Set up a calendar to compare dates and times
    var currentDate = new Date();

    var scheduledInventoryProducts = ProductMgr.queryProductsInCatalog(CatalogMgr.getCatalog('future-reserve'));

    while (scheduledInventoryProducts.hasNext()) {
        var product = scheduledInventoryProducts.next();
        // Retrieve scheduled inventory date for this SKU
        var scheduledInventoryDate = new Date(product.custom.futureReserveDate);
        var futureReserve = product.custom.futureReserve;
        // If the current date is greater than or equal to the scheduled date/time, update reserve quantity
        if (currentDate >= scheduledInventoryDate) {
            Transaction.wrap(function () {
                product.custom.reserveQty = futureReserve;
                product.custom.futureReserveDate = null;
                product.custom.futureReserve = null;
            });
        }
    }
}

module.exports = {
    execute: execute
};

