'use strict';

var base = module.superModule;


/**
 * @class
 * @classdesc Model that represents shipping information
 * @param {dw.order.Shipment} shipment - the default shipment of the current basket
 * @param {object} address - the address to use to filter the shipping method list
 * @param {object} customer - the current customer model
 * @param {string} containerView - the view of the product line items (order or basket)
 */
function ShippingModel(shipment, address, customer, containerView) {
    var shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');
    base.call(this,shipment, address, customer, containerView);
    this.applicableShippingMethods = shippingHelpers.getApplicableShippingMethods(shipment, address);
}

module.exports = ShippingModel;
