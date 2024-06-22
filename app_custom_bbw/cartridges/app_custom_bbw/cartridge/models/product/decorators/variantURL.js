'use strict';

var URLUtils = require('dw/web/URLUtils');

module.exports = function (object, apiProduct) {

    Object.defineProperty(object, 'variantURL', {
        enumerable: true,
        writable: true,
        value: apiProduct ?  URLUtils.abs('Product-Show', 'pid', apiProduct.ID).toString() : URLUtils.abs('Home-Show').toString()
    });
};
