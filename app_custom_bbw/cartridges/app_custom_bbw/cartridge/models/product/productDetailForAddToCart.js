'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');

/**
 * Decorate product with product tile information
 * @param {object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 * @returns {object} - Decorated product model
 */
module.exports = function productDetailForAddToCart(product, apiProduct, productType) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    decorators.base(product, apiProduct, productType);
    var params = {
        quantity: 0
    };
    var options = productHelper.getConfig(apiProduct, params);
    decorators.notifyMe(product, apiProduct);
    decorators.fragrance(product, apiProduct);
    decorators.availability(
        product,
        options.quantity,
        apiProduct.minOrderQuantity.value,
        apiProduct.availabilityModel
    );

    return product;
};
