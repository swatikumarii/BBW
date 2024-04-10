'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'canBeReturned', {
        enumerable: true,
        writable: true,
        configurable: true,
        value:
            'custom' in apiProduct &&
            'canBeReturned' in apiProduct.custom &&
            apiProduct.custom.canBeReturned !== ''
                ? apiProduct.custom.canBeReturned
                : false
    });
};
