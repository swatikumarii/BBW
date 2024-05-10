'use strict';

/**
 * @namespace Page
 */

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');

/**
 * Page-IncludeHeaderMenu : Append for customer name
 */
server.append(
    'IncludeHeaderMenu',
    server.middleware.include,
    cache.applyDefaultCache,
    function (req, res, next) {
        var viewData = res.getViewData();
        viewData.customerName = req.currentCustomer.profile ? req.currentCustomer.profile.firstName : null;
        res.setViewData(viewData);
        next();
    }
);

module.exports = server.exports();
