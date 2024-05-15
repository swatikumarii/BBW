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

    Object.defineProperty(object, 'UPC', {
        enumerable: true,
        writable: true,
        configurable: true,
        value:
            'UPC' in apiProduct &&
            apiProduct.UPC !== ''
                ? apiProduct.UPC
                : ''
    });

};
