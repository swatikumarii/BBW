'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var promotionCache = require('*/cartridge/scripts/util/promotionCache');

/**
 * Decorate product with product tile information
 * @param {object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 * @returns {object} - Decorated product model
 */
module.exports = function productTile(product, apiProduct, productType) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var productSearchHit = productHelper.getProductSearchHit(apiProduct);
    decorators.base(product, apiProduct, productType);
    decorators.searchPrice(product, productSearchHit, promotionCache.promotions, productHelper.getProductSearchHit);
    decorators.images(product, apiProduct, { types: ['medium'], quantity: 'all' });
    decorators.ratings(product);
    if (productType === 'set') {
        decorators.setProductsCollection(product, apiProduct);
    }

    decorators.searchVariationAttributes(product, productSearchHit);

    var params = {
        quantity: 0
    };
    var options = productHelper.getConfig(apiProduct, params);
    decorators.promotions(product, options.promotions);
    decorators.notifyMe(product, apiProduct);
    decorators.badge(product, apiProduct);
    decorators.availability(
        product,
        options.quantity,
        apiProduct.minOrderQuantity.value,
        apiProduct.availabilityModel
    );

    return product;
};
