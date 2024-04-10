'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'fragranceDescription', {
        enumerable: true,
        writable: true,
        configurable: true,
        value:
            'custom' in apiProduct &&
            'fragranceDescription' in apiProduct.custom &&
            apiProduct.custom.fragranceDescription !== ''
                ? apiProduct.custom.fragranceDescription
                : false
    });
};
