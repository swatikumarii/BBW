'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var base = module.superModule;

module.exports = function bonusProduct(product, apiProduct, options, duuid) {
    base.call(this, product, apiProduct, options, duuid);
    decorators.images(product, apiProduct, { types: ['mediumLarge', 'extraLarge', 'small', 'mediumLarge_2x', 'extraLarge_2x', 'small_2x'], quantity: 'all' });
    decorators.fragrance(product, apiProduct);
    decorators.titlePartB(product, apiProduct);
    decorators.volume(product, apiProduct);
    decorators.pwpPrice(product, options.promotions, apiProduct);
    decorators.price(product, apiProduct, options.promotions, false, options.optionModel);
    return product;
};
