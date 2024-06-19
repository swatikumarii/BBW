'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var base = module.superModule;


module.exports = function fullProduct(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);
    decorators.maxOrderQty(product, apiProduct);
    decorators.promotions(product, options.promotions);
    decorators.fragrance(product, apiProduct);
    decorators.titlePartB(product, apiProduct);
    decorators.volume(product, apiProduct);
    decorators.expressShip(product, apiProduct);
    decorators.return(product, apiProduct);
    decorators.usageInstruction(product, apiProduct);
    decorators.ingredients(product, apiProduct);
    decorators.moreInfo(product, apiProduct);
    decorators.isEgiftCard(product, apiProduct);
    if (options.variationModel) {
        decorators.images(product, options.variationModel, {
            types: ['mediumLarge', 'extraLarge', 'small', 'mediumLarge_2x', 'extraLarge_2x', 'small_2x'],
            quantity: 'all'
        });
    } else {
        decorators.images(product, apiProduct, {
            types: ['mediumLarge', 'extraLarge', 'small', 'mediumLarge_2x', 'extraLarge_2x', 'small_2x'],
            quantity: 'all'
        });
    }
    return product;
};
