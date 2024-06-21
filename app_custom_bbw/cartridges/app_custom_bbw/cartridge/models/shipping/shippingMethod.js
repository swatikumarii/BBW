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
    this.isFree = shippingCost.amount.value === 0;
}

module.exports = ShippingMethodModel;
