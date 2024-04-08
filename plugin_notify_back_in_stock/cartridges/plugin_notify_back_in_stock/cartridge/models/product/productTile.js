'use strict';

var base = module.superModule;

/**
 * Decorate product with product tile information
 * @param {object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 * @returns {object} - Decorated product model
 */
module.exports = function productTile(product, apiProduct, productType) {
    var decorators = require('*/cartridge/models/product/decorators/index');
    base.call(this, product, apiProduct, productType);
    decorators.notifyMe(product, apiProduct);

    var options = {};
    options.quantity = 0;
    decorators.availability(
        product,
        options.quantity,
        apiProduct.minOrderQuantity.value,
        apiProduct.availabilityModel
    );
    return product;
};
