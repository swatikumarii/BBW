'use strict';

/**
 * @namespace Tile
 */

var server = require('server');
server.extend(module.superModule);

/**
 * Tile-Show : Used to return data for rendering a product tile
 */
server.append(
    'Show',
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var viewData = res.getViewData();
        if (req.querystring.cgid) {
            var isEgiftCard =
                'isEgiftCard' in viewData.product &&
                viewData.product.isEgiftCard &&
                viewData.product.isEgiftCard === true;
            if (!isEgiftCard) {
                viewData.urls.product = URLUtils.url('Product-Show', 'pid', viewData.product.id, 'cgid', req.querystring.cgid);
            }
        }
        res.setViewData(viewData);
        next();
    }
);

module.exports = server.exports();
