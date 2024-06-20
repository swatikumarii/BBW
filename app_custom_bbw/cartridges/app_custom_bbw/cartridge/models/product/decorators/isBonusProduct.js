'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'isBonusProduct', {
        enumerable: true,
        writable: true,
        configurable: true,
        value:
            'custom' in apiProduct &&
            'isBonusProduct' in apiProduct.custom &&
            apiProduct.custom.isBonusProduct
                ? apiProduct.custom.isBonusProduct
                : false
    });
};
