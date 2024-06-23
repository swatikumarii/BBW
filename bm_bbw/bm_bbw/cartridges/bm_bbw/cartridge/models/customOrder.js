'use strict';

// var OrderMgr = require("dw/order/OrderMgr");
var Locale = require("dw/util/Locale");

/**
 * @namespace Order
 */

function getInvoice(orderNo) {
    var OrderMgr = require('dw/order/OrderMgr');
    // var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
    var orderModel = require("*/cartridge/models/order");
    var TaxMgr = require('dw/order/TaxMgr');

    var order = OrderMgr.getOrder(orderNo);
    var taxClassId = TaxMgr.getDefaultTaxClassID();
    var taxJurisdictionId = TaxMgr.getDefaultTaxJurisdictionID();
    var getTaxRate = TaxMgr.getTaxRate(taxClassId, taxJurisdictionId);
    var taxRate = getTaxRate * 100;

    if (order) {
        // var orderModel = orderHelpers.getOrderDetailsByID(
        //   req.querystring.orderNo,
        //   req.locale.id
        // );

        var config = {
            numberOfLineItems: "*",
        };

        // var currentLocale = Locale.getLocale(locale);

        var orderModelData = orderModel.OrderModel(order, {
          config: config,
          // ,
          // countryCode: currentLocale.country,
        });
        return {
          order: orderModelData,
          taxRate: taxRate,
        };
    }
    return {};
}


getInvoice.public = true;

exports.getInvoice = getInvoice;

// module.exports = getInvoice;

