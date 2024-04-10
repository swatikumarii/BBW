'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'showReturnSection', {
        enumerable: true,
        writable: true,
        value:
            'custom' in apiProduct &&
            'showReturnSection' in apiProduct.custom &&
            apiProduct.custom.showReturnSection !== ''
                ? apiProduct.custom.showReturnSection
                : false
    });
};
