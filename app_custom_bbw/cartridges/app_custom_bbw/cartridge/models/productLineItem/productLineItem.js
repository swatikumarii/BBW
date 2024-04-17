'use strict';

var base = module.superModule;
var productDecorators = require('*/cartridge/models/product/decorators/index');

/**
 * Decorate product with product line item information
 * @param {object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {object} options - Options passed in from the factory
 * @returns {object} - Decorated product model
 */
module.exports = function productLineItem(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);
    productDecorators.titlePartB(product, apiProduct);
    productDecorators.fragrance(product, apiProduct);
    // productLineItemDecorators.priceTotal(product, options.lineItem);
    return product;
};
