'use strict';

var base = module.superModule;


/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {object} options - The current order's line items
 * @param {object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @class
 */
function OrderModel(lineItemContainer, options) {
    base.call(this, lineItemContainer, options);
    if (lineItemContainer) {
        this['2c2pPaymentMethod'] = 'custom' in lineItemContainer && lineItemContainer.custom && '2c2pPaymentMethod' in lineItemContainer.custom && lineItemContainer.custom['2c2pPaymentMethod'] ? lineItemContainer.custom['2c2pPaymentMethod'] : '2c2p';
    }
}

module.exports = OrderModel;
