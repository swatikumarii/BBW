'use strict';

var base = module.superModule;
var productLineItemDecorators = require('*/cartridge/models/productLineItem/decorators/index');

/**
 * Decorate product with order line item information
 * @param {object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {object} options - Options passed in from the factory
 * @returns {object} - Decorated product model
 */
module.exports = function orderLineItem(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);
    productLineItemDecorators.totalSavings(product, options.lineItem);
    return product;
};
