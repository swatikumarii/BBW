'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'showReturnSection', {
        enumerable: true,
        writable: true,
        value:
            'custom' in apiProduct &&
            'showReturnSection' in apiProduct.custom &&
            apiProduct.custom.showReturnSection
                ? apiProduct.custom.showReturnSection
                : false
    });

    Object.defineProperty(object, 'canBeReturned', {
        enumerable: true,
        writable: true,
        configurable: true,
        value:
            'custom' in apiProduct &&
            'canBeReturned' in apiProduct.custom &&
            apiProduct.custom.canBeReturned
                ? apiProduct.custom.canBeReturned
                : false
    });
};
