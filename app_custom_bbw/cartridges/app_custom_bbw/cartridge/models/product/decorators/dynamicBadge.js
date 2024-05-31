'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'dynamicBadge', {
        enumerable: true,
        writable: true,
        configurable: true,
        value:
            'custom' in apiProduct &&
            'dynamicBadge' in apiProduct.custom &&
            apiProduct.custom.dynamicBadge
                ? apiProduct.custom.dynamicBadge
                : null
    });
};
