'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');

/**
 * noInventoryProducts function is responsible to get all the product with no inventory
 */
function noInventoryProducts() {
    var productWithoutInventory = [];
    var allProducts = ProductMgr.queryAllSiteProducts();
    // Iterate through each product
    while (allProducts.hasNext()) {
        var product = allProducts.next();
        // Get those products which don't have the inventory bucket
        if (!product.master) {
            if (product.availabilityModel.inventoryRecord === null) {
                productWithoutInventory.push(product.ID);
            }
        }
    }

    try {
        var toEmailAddress = Site.current.getCustomPreferenceValue(
            'jobNotificationToEmail'
        );
        var ccEmailAddress = Site.current.getCustomPreferenceValue(
            'jobNotificationCCEmail'
        );

        var emailObj = {
            to: toEmailAddress,
            cc: ccEmailAddress,
            subject: Resource.msg('no.inventory.product', 'common', null),
            from:
                Site.current.getCustomPreferenceValue('customerServiceEmail') ||
                'no-reply@salesforce.com'
        };

        emailHelpers.sendEmail(emailObj, 'mail/noInventoryProducts', {
            productWithoutInventory:
                productWithoutInventory
        });
    } catch (error) {
        var logger = require('dw/system/Logger').getLogger('EmailTransactionLogs');
        logger.info(
            'Error: Email not sent to {0} at time {1} due to {2}',
            Site.current.getCustomPreferenceValue('jobNotificationToEmail'),
            new Date().toString(),
            error
        );
    }
}

module.exports.noInventoryProducts = noInventoryProducts;
