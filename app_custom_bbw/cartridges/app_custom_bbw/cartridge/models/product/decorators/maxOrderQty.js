'use strict';

module.exports = function (object, apiProduct) {
    var productLevelMaxOrderQty =
        'custom' in apiProduct &&
        'maxOrderQty' in apiProduct.custom &&
        apiProduct.custom.maxOrderQty
            ? apiProduct.custom.maxOrderQty
            : false;
    var productLevelReserveQty =
        'custom' in apiProduct &&
        'reserveQty' in apiProduct.custom &&
        apiProduct.custom.reserveQty
            ? apiProduct.custom.reserveQty
            : false;
    var globalLevelReserveQty =
         dw.system.Site.getCurrent().getCustomPreferenceValue('reserveQty');
    var globalLevelMaxOrderQty =
         dw.system.Site.getCurrent().getCustomPreferenceValue('maxOrderQty');
    var reserveOosQty = productLevelReserveQty || globalLevelReserveQty;
    var maxOrderQty = productLevelMaxOrderQty || globalLevelMaxOrderQty;
    var maxOrderQtyByReserveStock = apiProduct.availabilityModel.inventoryRecord.ATS.value - reserveOosQty;
    if (maxOrderQty && maxOrderQtyByReserveStock) {
        maxOrderQty = (maxOrderQtyByReserveStock < maxOrderQty) ? maxOrderQtyByReserveStock : maxOrderQty;
    } else if (!maxOrderQty) {
        maxOrderQty = maxOrderQtyByReserveStock;
    }
    
    Object.defineProperty(object, 'maxOrderQty', {
        enumerable: true,
        writable: true,
        configurable: true,
        value: maxOrderQty
    });
};
