'use strict';

module.exports = function (object, apiProduct) {
    var productValidationHelpers = require('*/cartridge/scripts/helpers/productValidationHelpers');
    var maxOrderQty =
        productValidationHelpers.getProductMaxOrderQty(apiProduct);
    
    Object.defineProperty(object, 'maxOrderQty', {
        enumerable: true,
        writable: true,
        configurable: true,
        value: maxOrderQty
    });
};
