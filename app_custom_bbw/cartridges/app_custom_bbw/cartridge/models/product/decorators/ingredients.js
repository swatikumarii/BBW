'use strict';

module.exports = function (object, apiProduct) {

    Object.defineProperty(object, 'ingredients', {
        enumerable: true,
        writable: true,
        configurable: true,
        value:
            'custom' in apiProduct &&
            'ingredients' in apiProduct.custom &&
            apiProduct.custom.ingredients !== ''
                ? Object.values(apiProduct.custom.ingredients).join(', ')
                : false
    });
};
