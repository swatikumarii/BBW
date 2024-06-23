'use strict';

/**
 * @namespace Order
 */

function Invoice(orderNo) {
    var OrderMgr = require('dw/order/OrderMgr');
    var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
    var TaxMgr = require('dw/order/TaxMgr');

    var order = OrderMgr.getOrder(orderNo);
    var taxClassId = TaxMgr.getDefaultTaxClassID();
    var taxJurisdictionId = TaxMgr.getDefaultTaxJurisdictionID();
    var getTaxRate = TaxMgr.getTaxRate(taxClassId, taxJurisdictionId);
    var taxRate = getTaxRate * 100;

    if (order) {
        var orderModel = orderHelpers.getOrderDetailsByID(
          req.querystring.orderNo,
          req.locale.id
        );
        res.render('order/invoiceDownload', {
            order: orderModel,
            taxRate: taxRate
        });
    }
    next();
}


Invoice.public = true;

exports.Invoice = Invoice;
