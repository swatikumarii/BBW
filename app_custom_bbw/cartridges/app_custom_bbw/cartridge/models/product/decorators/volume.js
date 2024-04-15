'use strict';

module.exports = function (object, apiProduct) {

    Object.defineProperty(object, 'volume', {
        enumerable: true,
        writable: true,
        value:
            'custom' in apiProduct &&
            'volume' in apiProduct.custom &&
            apiProduct.custom.volume !== ''
                ? apiProduct.custom.volume
                : false
    });
};
