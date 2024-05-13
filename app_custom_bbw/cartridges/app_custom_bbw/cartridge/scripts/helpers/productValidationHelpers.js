'use strict';

/**
 * Calculate maxQty of a product that can be added to cart based on reserveQty and maxOrderQty
 * @param {object} apiProduct current basket
 * @returns {object} result
 */
function getProductMaxOrderQty(apiProduct) {
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
    var maxOrderQtyByReserveStock =
        apiProduct.availabilityModel.inventoryRecord && apiProduct.availabilityModel.inventoryRecord.ATS.value - reserveOosQty;
    if (apiProduct.availabilityModel.inventoryRecord.perpetual) {
        maxOrderQtyByReserveStock = 999;
    }
    if (maxOrderQty && maxOrderQtyByReserveStock) {
        maxOrderQty =
                maxOrderQtyByReserveStock < maxOrderQty
                    ? maxOrderQtyByReserveStock
                    : maxOrderQty;
    } else if (!maxOrderQty) {
        maxOrderQty = maxOrderQtyByReserveStock;
    }
    return maxOrderQty;
}

module.exports = {
    getProductMaxOrderQty: getProductMaxOrderQty
};
