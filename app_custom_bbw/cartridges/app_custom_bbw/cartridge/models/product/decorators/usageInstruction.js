'use strict';

module.exports = function (object, apiProduct) {

    Object.defineProperty(object, 'usageInstruction', {
        enumerable: true,
        writable: true,
        configurable: true,
        value:
            'custom' in apiProduct &&
            'usageInstruction' in apiProduct.custom &&
            apiProduct.custom.usageInstruction !== ''
                ? apiProduct.custom.usageInstruction
                : false
    });
};
