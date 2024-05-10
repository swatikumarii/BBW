'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'dangerousGoods', {
        enumerable: true,
        value: apiProduct && apiProduct.custom.dangerousGoods ? apiProduct.custom.dangerousGoods : false,
        writable: true
    });
};

