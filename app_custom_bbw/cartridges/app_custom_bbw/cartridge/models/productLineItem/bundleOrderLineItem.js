'use strict';

var base = module.superModule;
var productDecorators = require('*/cartridge/models/product/decorators/index');

module.exports = function productLineItem(product, apiProduct, options, factory) {
    base.call(this, product, apiProduct, options, factory);
    productDecorators.images(product, apiProduct, { types: ['small', 'small_2x'], quantity: 'single' });

    return product;
};
