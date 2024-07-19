'use strict';

module.exports = function (object, apiProduct) {

    Object.defineProperty(object, 'priceIfSoldSeparatly', {
        enumerable: true,
        writable: true,
        configurable: true,
        value:
            'custom' in apiProduct &&
            'priceIfSoldSeparatly' in apiProduct.custom &&
            apiProduct.custom.priceIfSoldSeparatly !== ''
                ? apiProduct.custom.priceIfSoldSeparatly
                : false
    });

};
