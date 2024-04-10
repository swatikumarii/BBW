'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var base = module.superModule;


module.exports = function fullProduct(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);

    decorators.fragranceName(product, apiProduct);
    decorators.fragranceDescription(product, apiProduct);
    decorators.titlePartB(product, apiProduct);
    decorators.volume(product, apiProduct);
    decorators.expressShip(product, apiProduct);
    decorators.showReturnSection(product, apiProduct);
    decorators.canBeReturned(product, apiProduct);
    decorators.usageInstruction(product, apiProduct);
    decorators.ingredients(product, apiProduct);
    return product;
};
