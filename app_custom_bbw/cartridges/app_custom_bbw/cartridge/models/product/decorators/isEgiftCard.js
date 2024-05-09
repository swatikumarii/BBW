'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'isEgiftCard', {
        enumerable: true,
        writable: true,
        configurable: true,
        value:
            'custom' in apiProduct &&
            'isEgiftCard' in apiProduct.custom &&
            apiProduct.custom.isEgiftCard
                ? apiProduct.custom.isEgiftCard
                : false
    });
};
