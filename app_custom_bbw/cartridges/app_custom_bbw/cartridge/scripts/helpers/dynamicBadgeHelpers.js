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
        var productLineItems = currentBasket.getAllProductLineItems();
        Transaction.wrap(function () {
            var productWithQuantity = [];
            collections.forEach(productLineItems, function (pli) {
                if (
                    pli.product.custom &&
                    'isDynamicBadgeEnabled' in pli.product.custom &&
                    pli.product.custom.isDynamicBadgeEnabled
                ) {
                    productWithQuantity.push(
                        pli.productID + '#' + pli.quantityValue
                    );
                }
            });
            // eslint-disable-next-line
            profile.custom.cartProducts = productWithQuantity;
        });
    }
}

module.exports = {
    updateCartDetailInProfile: updateCartDetailInProfile
};
