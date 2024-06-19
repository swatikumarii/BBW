'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var base = module.superModule;

module.exports = function bonusProduct(product, apiProduct, options, duuid) {
    base.call(this, product, apiProduct, options, duuid);
    decorators.images(product, apiProduct, { types: ['large', 'small', 'large_2x', 'small_2x'], quantity: 'all' });

    return product;
};
