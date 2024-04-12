/**
 * File Name          : greetingCard.js
 * Description        : greetingCardHelpers
 * Ver          Modification
 * 1.0          Common functions
 */

'use strict';

var site = require('dw/system/Site');
var productMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var productHelpers = require('*/cartridge/scripts/helpers/product');
var customPreferenceNames = require('*/cartridge/config/customPreferenceNames');

/**
 * @param {dw.order.Basket} currentBasket - Current Basket
 * @param {string} pid - product id
 */
function removeGreetingCardProductLineItem(currentBasket, pid) {
    var greetingCardCategoryName = site.current.getCustomPreferenceValue(
        customPreferenceNames.greetingCardCategoryName
    );
    var greetingCardProductLineItem =
        productHelpers.getProductLineItemByCategory(
            currentBasket.getAllProductLineItems(),
            greetingCardCategoryName
        );
    if (greetingCardProductLineItem) {
        var product = productMgr.getProduct(pid);
        var isGreetingCardProduct = productHelpers.isCategoryMatches(
            product,
            greetingCardCategoryName
        );
        if (isGreetingCardProduct) {
            // If removed product is GiftWrapCategoryProduct than reset gift wrap attribute
            Transaction.wrap(function () {
                // RemoveProductLineItem
                currentBasket.removeProductLineItem(
                    greetingCardProductLineItem
                );
            });
        }
    }
}

/**
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - the product line items
 *                                                       of the current line item container
 * @param {string} greetingCardMessage - Greeting card message
 */
function updateGreetingCardMessage(productLineItems, greetingCardMessage) {
    if (greetingCardMessage) {
        var greetingCardCategoryName = site.current.getCustomPreferenceValue(
            customPreferenceNames.greetingCardCategoryName
        );
        var productLineItemArray = productLineItems.toArray();
        Transaction.wrap(function () {
            for (var i = 0; i < productLineItemArray.length; i++) {
                var pli = productLineItemArray[i];
                if (
                    productHelpers.isCategoryMatches(
                        pli.product,
                        greetingCardCategoryName
                    )
                ) {
                    pli.custom.greetingCardMessage = greetingCardMessage;
                    break;
                }
            }
        });
    }
}

module.exports = {
    removeGreetingCardProductLineItem: removeGreetingCardProductLineItem,
    updateGreetingCardMessage: updateGreetingCardMessage
};
