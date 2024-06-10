'use strict';

var base = module.superModule;
var productDecorators = require('*/cartridge/models/product/decorators/index');

module.exports = function bonusProductLineItem(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);
    productDecorators.images(product, apiProduct, { types: ['small', 'small_2x'], quantity: 'single' });

    return product;
};
