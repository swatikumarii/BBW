'use strict';

var base = module.superModule;
var productDecorators = require('*/cartridge/models/product/decorators/index');
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
    productDecorators.images(product, apiProduct, { types: ['small', 'small_2x'], quantity: 'single' });
    productDecorators.promotions(product, options.promotions);
    productLineItemDecorators.totalSavings(product, options.lineItem);
    if (product.isBonusProductLineItem) {
        product.isPWP = false;
        product.promotions.forEach(function (promotion) {
            if (promotion.isPWPPromo) {
                product.isPWP = true;
            }
        });
    }
    return product;
};
