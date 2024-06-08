'use strict';

var base = module.superModule;
var productDecorators = require('*/cartridge/models/product/decorators/index');
var productLineItemDecorators = require('*/cartridge/models/productLineItem/decorators/index');

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
    productDecorators.volume(product, apiProduct);
    productDecorators.fragrance(product, apiProduct);
    productLineItemDecorators.isFreeItem(product, options.lineItem);
    productLineItemDecorators.dangerousGoods(product, apiProduct);
    productDecorators.promotions(product, options.promotions);
    productLineItemDecorators.promotionsHTML(product, options.promotions);
    productLineItemDecorators.promoPrice(product, options.lineItem);
    productLineItemDecorators.totalSavings(product, options.lineItem);
    productDecorators.maxOrderQty(product, apiProduct);
    productDecorators.dynamicBadge(product, apiProduct);
    productDecorators.badge(product, apiProduct);
    return product;
};
