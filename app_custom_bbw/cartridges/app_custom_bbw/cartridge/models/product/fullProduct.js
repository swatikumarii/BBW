'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var base = module.superModule;


module.exports = function fullProduct(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);

    decorators.fragrance(product, apiProduct);
    decorators.titlePartB(product, apiProduct);
    decorators.volume(product, apiProduct);
    decorators.expressShip(product, apiProduct);
    decorators.return(product, apiProduct);
    decorators.usageInstruction(product, apiProduct);
    decorators.ingredients(product, apiProduct);
    return product;
};
