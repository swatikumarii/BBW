'use strict';

var server = require('server');

server.extend(module.superModule);

/**
 * This function ensures that only a logged in user can add product to wishlist
 * It also append data to response to support toggle behaviour
 */
server.prepend('AddProduct', function (req, res, next) {
    var viewData = res.getViewData();
    var checkUser = req.currentCustomer.raw.registered;
    if (checkUser === false) {
        res.json({
            redirect: true,
            isWishlistGuest: true,
            loginShow: true,
        });
        this.emit('route:Complete', req, res);
        return;
    }
    viewData.loginShow = false;
    res.setViewData(viewData);
    next();
});

/**
 * Wishlist-Show : The Wishlist-Show append to update breadcrumbs
 * @name Wishlist-Show
 */
server.append('Show', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var viewData = res.getViewData();

    var breadcrumbs = [
        {
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        },
        {
            htmlValue: Resource.msg('page.title.myaccount', 'account', null),
            url: URLUtils.url('Account-Show').toString()
        },
        {
            htmlValue: Resource.msg('label.wishlist', 'account', null),
            url: URLUtils.url('Wishlist-Show').toString()
        }
    ];
    viewData.breadcrumbs = breadcrumbs;

    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
