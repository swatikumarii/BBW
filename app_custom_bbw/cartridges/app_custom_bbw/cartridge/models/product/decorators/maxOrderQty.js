'use strict';

module.exports = function (object, apiProduct) {
    var productLevelMaxOrderQty =
        'custom' in apiProduct &&
        'maxOrderQty' in apiProduct.custom &&
        apiProduct.custom.maxOrderQty
            ? apiProduct.custom.maxOrderQty
            : false;
    var globalLevelMaxOrderQty =
        dw.system.Site.getCurrent().getCustomPreferenceValue('maxOrderQty');
    var maxOrderQty = productLevelMaxOrderQty || globalLevelMaxOrderQty;
    Object.defineProperty(object, 'maxOrderQty', {
        enumerable: true,
        writable: true,
        configurable: true,
        value: maxOrderQty
    });
};
