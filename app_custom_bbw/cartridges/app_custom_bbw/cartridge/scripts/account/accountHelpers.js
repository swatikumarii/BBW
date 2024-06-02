'use strict';

var base = module.superModule;

var URLUtils = require('dw/web/URLUtils');

/**
 * Handle Logged In Session
 * @param {object} req - The request object for the current controller request
 * @param {object} res - The response object for the current controller request
 * @param {Function} next - Executes the next step in the controller chain
 */
function handleLoggedInSession(req, res, next) {
    if (
        req.currentCustomer &&
        req.currentCustomer.raw &&
        req.currentCustomer.raw.profile
    ) {
        res.redirect(URLUtils.url('Home-Show'));
    }
    next();
}

module.exports = {
    handleLoggedInSession: handleLoggedInSession
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
