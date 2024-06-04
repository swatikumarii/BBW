'use strict';

var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');

/**
 * This function help to update cartProducts in customer
 * @param {string} profile - profile
 */
function updateCartDetailInProfile(profile) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (profile) {
        Transaction.wrap(function () {
            var productIds = [];
            if (currentBasket) {
                var productLineItems = currentBasket.getAllProductLineItems();
                collections.forEach(productLineItems, function (pli) {
                    if (
                        pli.product.custom &&
                        'isDynamicBadgeEnabled' in pli.product.custom &&
                        pli.product.custom.isDynamicBadgeEnabled
                    ) {
                        productIds.push(pli.productID);
                    }
                });
            }
            // eslint-disable-next-line
            profile.custom.cartProducts = productIds;
        });
    }
}

module.exports = {
    updateCartDetailInProfile: updateCartDetailInProfile
};
