'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'moreInfo', {
        enumerable: true,
        writable: true,
        configurable: true,
        value:
            'custom' in apiProduct &&
            'moreInfo' in apiProduct.custom &&
            apiProduct.custom.moreInfo !== ''
                ? apiProduct.custom.moreInfo
                : false
    });
};
