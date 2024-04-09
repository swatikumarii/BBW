'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var base = module.superModule;


module.exports = function fullProduct(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);

    decorators.notifyMe(product, apiProduct);
    decorators.availableToSell(product, apiProduct.availabilityModel);
    decorators.isMaster(product, apiProduct);


    return product;
};
