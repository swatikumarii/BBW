'use strict';

var SystemObjectMgr = require('dw/object/SystemObjectMgr');
var Transaction = require('dw/system/Transaction');
var ProductMgr = require('dw/catalog/ProductMgr');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var SiteMgr = require('dw/system/Site');


// Define the job to sync scheduled inventory
function execute() {
    var sites = SiteMgr.getAllSites();
    var siteIterator = sites.iterator();

    while (siteIterator.hasNext()) {
        var site = siteIterator.next();
        var siteID = site.getID();
        var catalog = CatalogMgr.getCatalog('future-reserve-' + siteID);

        if (catalog) {
            var scheduledInventoryProducts = ProductMgr.queryProductsInCatalog(catalog);

            while (scheduledInventoryProducts.hasNext()) {
                var product = scheduledInventoryProducts.next();

                // Retrieve the scheduled inventory date and future reserve quantity for this SKU
                var scheduledInventoryDate = product.custom.futureReserveDate;
                var futureReserve = product.custom.futureReserve;

                // Check if futureReserveDate is defined and valid
                if (scheduledInventoryDate !== null && futureReserve !== null) {
                    // Convert futureReserveDate to a JavaScript Date object
                    scheduledInventoryDate = new Date(new Date(scheduledInventoryDate).getTime() - 899828);

                    // Retrieve current date
                    var currentDate = new Date();

                    // If the current date is greater than or equal to the scheduled inventory date/time, update reserve quantity
                    if (currentDate >= scheduledInventoryDate) {
                        // Update product reserve quantity and clear the custom attributes
                        Transaction.wrap(function () {
                            product.custom.reserveQty = futureReserve;  // Set future reserve quantity to reserveQty
                            product.custom.futureReserveDate = null;   // Clear the futureReserveDate
                            product.custom.futureReserve = null;       // Clear the futureReserve
                        });
                    }
                }
            }
        }
    }
}

module.exports = {
    execute: execute
};
