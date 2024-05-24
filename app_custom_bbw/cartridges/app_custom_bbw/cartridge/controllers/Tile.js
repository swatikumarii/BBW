'use strict';

/**
 * @namespace Tile
 */

var server = require('server');
server.extend(module.superModule);

/**
 * Tile-Show : Used to return data for rendering a product tile
 * @name Tile-Show
 * @function
 * @memberof Tile
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - append
 */
server.append('Show', function (req, res, next) {
    var viewData = res.getViewData();
    var showOutOfStockProducts = req.querystring.showOutOfStockProducts !== 'false';
    viewData.showOutOfStockProducts = showOutOfStockProducts;
    res.setViewData(viewData);
    next();
});
module.exports = server.exports();
