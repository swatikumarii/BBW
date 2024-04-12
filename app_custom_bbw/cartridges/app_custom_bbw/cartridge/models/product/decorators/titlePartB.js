'use strict';

module.exports = function (object, apiProduct) {

    Object.defineProperty(object, 'titlePartB', {
        enumerable: true,
        writable: true,
        value:
            'custom' in apiProduct &&
            'titlePartB' in apiProduct.custom &&
            apiProduct.custom.titlePartB !== ''
                ? apiProduct.custom.titlePartB
                : false
    });
};
