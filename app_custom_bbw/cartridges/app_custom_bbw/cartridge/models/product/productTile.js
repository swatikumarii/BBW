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
    var productMasterSearchHit = productSearchHit;
    if (productType === 'variant') {
        productMasterSearchHit = productHelper.getProductSearchHit(apiProduct.masterProduct);
    }
    decorators.base(product, apiProduct, productType);
    decorators.dynamicBadge(product, apiProduct);
    decorators.searchPrice(product, productMasterSearchHit, promotionCache.promotions, productHelper.getProductSearchHit);
    decorators.images(product, apiProduct, { types: ['medium', 'medium_2x'], quantity: 'all' });
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
    decorators.isEgiftCard(product, apiProduct);
    decorators.badge(product, apiProduct);
    decorators.fragrance(product, apiProduct);
    decorators.titlePartB(product, apiProduct);
    decorators.promoPrice(product, options.promotions, apiProduct);
    decorators.availability(
        product,
        options.quantity,
        apiProduct.minOrderQuantity.value,
        apiProduct.availabilityModel
    );

    return product;
};
