'use strict';

exports.transformProduct = function (product, facebookProduct) {
    var googleCategory =
        product && product.custom && 'googleCategory' in product.custom
            ? product.custom.googleCategory
            : null;
    facebookProduct.setGoogleProductCategory(googleCategory);
};
