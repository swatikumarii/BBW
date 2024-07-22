'use strict';

/**
 * getPromotionPrice
 * @param {any} apiProduct - product object.
 * @returns {any} gift inclued product details
 */
function getGiftContentPrice(apiProduct) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var decorators = require('*/cartridge/models/product/decorators/index');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var giftSetContents = [];
    var options = null;
    if (apiProduct.custom && 'giftsetContents' in apiProduct.custom
         && apiProduct.custom.giftsetContents) {
        for(var i = 0; i < apiProduct.custom.giftsetContents.length; i++) {
            var pid = apiProduct.custom.giftsetContents[i];
            var product1 = Object.create(null);
            var apiProduct1 = ProductMgr.getProduct(pid);
            if (apiProduct1) {
                var params = {
                    productid: pid,
                    quantity: 1,
                    variables: null,
                    pview: 'productLineItem',
                    options: options
                };
                options = productHelper.getConfig(apiProduct1, params);
                if (options.variationModel) {
                    decorators.images(product1, options.variationModel, {
                        types: ['mediumLarge', 'extraLarge', 'small', 'mediumLarge_2x', 'extraLarge_2x', 'small_2x'],
                        quantity: 'all'
                    });
                } else {
                    decorators.images(product1, apiProduct1, {
                        types: ['mediumLarge', 'extraLarge', 'small', 'mediumLarge_2x', 'extraLarge_2x', 'small_2x'],
                        quantity: 'all'
                    });
                }
                decorators.price(product1, apiProduct1, options.promotions, false, options.optionModel);
                var name = apiProduct1.name ? apiProduct1.name : '';
                product1.productName = apiProduct1.custom.fragranceName ? apiProduct1.custom.fragranceName : name;
                giftSetContents.push(product1);
            }
        }
    }
    return giftSetContents;
}

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'giftContent', {
        enumerable: true,
        value: getGiftContentPrice(apiProduct)
    });
};
