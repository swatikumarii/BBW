'use strict';

module.exports = function (object, apiProduct) {

    Object.defineProperty(object, 'fragranceName', {
        enumerable: true,
        writable: true,
        configurable: true,
        value:
            'custom' in apiProduct &&
            'fragranceName' in apiProduct.custom &&
            apiProduct.custom.fragranceName !== ''
                ? apiProduct.custom.fragranceName
                : false
    });
};
