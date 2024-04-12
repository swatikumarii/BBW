'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'expressShip', {
        enumerable: true,
        writable: true,
        configurable: true,
        value:
            'custom' in apiProduct &&
            'expressShip' in apiProduct.custom &&
            apiProduct.custom.expressShip
                ? apiProduct.custom.expressShip
                : false
    });
};
