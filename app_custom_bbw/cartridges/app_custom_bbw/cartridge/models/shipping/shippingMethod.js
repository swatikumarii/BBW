'use strict';

var base = module.superModule;
/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {dw.order.ShippingMethod} shippingMethod - the default shipment of the current basket
 * @param {dw.order.Shipment} [shipment] - a Shipment
 */
function ShippingMethodModel(shippingMethod, shipment) {
    base.call(this, shippingMethod, shipment);
    var ShippingMgr = require('dw/order/ShippingMgr');
    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);
    var shippingCost = shipmentShippingModel.getShippingCost(shippingMethod);
    this.htmlDescription = 'custom' in shippingMethod && shippingMethod.custom  && 'htmlDescription' in  shippingMethod.custom && shippingMethod.custom.htmlDescription ? shippingMethod.custom.htmlDescription.source : '';

    var adjustedShippingTotalPrice = shipment && shipment.shippingPriceAdjustments && shipment.shippingPriceAdjustments.length > 0 ? Math.abs(shipment.shippingPriceAdjustments[0].priceValue):0;    
    var shippingTotalPrice = shipment.shippingTotalPrice.value;
    var shippingID =  shippingMethod.ID;
    var applyMethodID =  shipment.shippingMethodID;
    var isDiscountPrice = adjustedShippingTotalPrice > 0 ? parseFloat(shippingTotalPrice - adjustedShippingTotalPrice).toFixed(2) : 0;
    this.isFree = (shippingID == applyMethodID && shippingTotalPrice == adjustedShippingTotalPrice) ? true : shippingCost.amount.value === 0;
    this.isShippingDiscountPrice = (shippingID == applyMethodID && isDiscountPrice > 0) ? dw.util.StringUtils.formatMoney(new dw.value.Money(isDiscountPrice, session.currency.getCurrencyCode())) : 0;
}
module.exports = ShippingMethodModel;

