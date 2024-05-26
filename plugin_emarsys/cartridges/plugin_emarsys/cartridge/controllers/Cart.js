'use strict';

/**
 * @namespace Cart
 */

var server = require('server');
server.extend(module.superModule);
var BasketMgr = require('dw/order/BasketMgr');


server.prepend('RemoveProductLineItem', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var productLineItems = currentBasket.getAllProductLineItems(
        req.querystring.pid
    );
    var viewData = res.getViewData();
    for (var i = 0; i < productLineItems.length; i++) {
        var item = productLineItems[i];
        if (item.UUID === req.querystring.uuid) {
            viewData.itemToRemove = item;
        }
    }
    res.setViewData(viewData);

    next();
});

module.exports = server.exports();
