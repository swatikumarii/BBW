'use strict';

var BasketMgr = require('dw/order/BasketMgr');

module.exports = function (object, apiProduct) {
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var productValidationHelpers = require('*/cartridge/scripts/helpers/productValidationHelpers');
    var maxOrderQty =
        productValidationHelpers.getProductMaxOrderQty(apiProduct);
    var basket = BasketMgr.getCurrentBasket();
    var productLineItems = basket && basket.productLineItems;
    var qtyAlreadyInCart = 0;
    if (productLineItems) {
        qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
            apiProduct.ID,
            productLineItems
        );
    }
    var qtyAddedMoreThanStock = qtyAlreadyInCart > maxOrderQty;

    Object.defineProperty(object, 'maxOrderQty', {
        enumerable: true,
        writable: true,
        configurable: true,
        value: maxOrderQty
    });

    Object.defineProperty(object, 'qtyAddedMoreThanStock', {
        enumerable: true,
        writable: true,
        configurable: true,
        value: qtyAddedMoreThanStock
    });
};
