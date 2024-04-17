'use strict';

/**
 * @namespace LoginPopup
 */

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');


server.get('Show', csrfProtection.generateToken, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var target = req.querystring.rurl || 1;
    var rememberMe = false;
    var userName = '';
    var actionUrl = URLUtils.url('Account-Login', 'rurl', target);
    if (req.currentCustomer.credentials) {
        rememberMe = true;
        userName = req.currentCustomer.credentials.username;
    }

    res.render('/account/loginpopup', {
        rememberMe: rememberMe,
        userName: userName,
        actionUrl: actionUrl
    });

    next();

    // res.render('product/gridTile.isml', context);

    // next();
});

module.exports = server.exports();
