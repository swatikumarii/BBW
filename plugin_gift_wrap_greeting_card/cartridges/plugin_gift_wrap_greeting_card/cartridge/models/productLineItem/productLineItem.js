'use strict';

var base = module.superModule;

var productLineItemDecorators = require('*/cartridge/models/productLineItem/decorators/index');

/*
 * Decorate product with product line item information
 * @returns {Object} - Decorated product model
 */
module.exports = function productLineItem(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);
    productLineItemDecorators.isGreetingCard(product, apiProduct);
    return product;
};
