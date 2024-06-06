'use strict';

module.exports = function (object, product) {
    Object.defineProperty(object, 'titleBadge', {
        enumerable: true,
        value: 'titleBadge' in product.custom ? product.custom.titleBadge : null
    });
    Object.defineProperty(object, 'badge1', {
        enumerable: true,
        value: 'badge1' in product.custom ? product.custom.badge1 : null
    });
    Object.defineProperty(object, 'badge2', {
        enumerable: true,
        value: 'badge2' in product.custom ? product.custom.badge2 : null
    });
    Object.defineProperty(object, 'badge3', {
        enumerable: true,
        value: 'badge3' in product.custom ? product.custom.badge3 : null
    });
};
