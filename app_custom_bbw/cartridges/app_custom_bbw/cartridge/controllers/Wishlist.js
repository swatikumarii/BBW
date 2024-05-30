'use strict';

var server = require('server');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var PAGE_SIZE_ITEMS = 15;

server.extend(module.superModule);

/**
 * This function ensures that only a logged in user can add product to wishlist
 * It also append data to response to support toggle behaviour
 */
server.prepend('AddProduct', function (req, res, next) {
    var pid = req.form.pid;
    var viewData = res.getViewData();
    var checkUser = req.currentCustomer.raw.registered;
    if (checkUser === false) {
        res.json({
            redirect: true,
            isWishlistGuest: true,
            loginShow: true,
            pid: pid
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
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var viewData = res.getViewData();

    var breadcrumbs = [{
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

    var userEmail = req.currentCustomer.raw.registered ? req.currentCustomer.profile.email : false;

    if (viewData.wishlist && viewData.wishlist.items && viewData.wishlist.items.length > 0) {
        for (var index = 0; index < viewData.wishlist.items.length; index++) {
            var productRecord = CustomObjectMgr.getCustomObject('notifyBackInStock', viewData.wishlist.items[index].pid);
            viewData.wishlist.items[index].productPresentInNotifyList = false;
            if (userEmail && productRecord !== null && productRecord.custom.user.indexOf(userEmail) !== -1) {
                viewData.wishlist.items[index].productPresentInNotifyList = true;
            }
        }
    }

    viewData.breadcrumbs = breadcrumbs;

    res.setViewData(viewData);
    next();
});

server.replace('ShowOthers', function (req, res, next) {
    var id = req.querystring.id;
    var productListMgr = require('dw/customer/ProductListMgr');
    var apiList = productListMgr.getProductList(id);
    var firstName = apiList.owner.profile.firstName;
    var breadcrumbs = [{
        htmlValue: Resource.msg('global.home', 'common', null),
        url: URLUtils.home().toString()
    }];
    var loggedIn = req.currentCustomer.profile;
    if (loggedIn) {
        breadcrumbs.push({
            htmlValue: Resource.msg('page.title.myaccount', 'account', null),
            url: URLUtils.url('Account-Show').toString()
        });
    }
    if (apiList) {
        if (apiList.owner.ID === req.currentCustomer.raw.ID) {
            res.redirect(URLUtils.url('Wishlist-Show'));
        }
        var WishlistModel = require('*/cartridge/models/productList');
        var wishlistModel = new WishlistModel(apiList, {
            type: 'wishlist',
            publicView: true,
            pageSize: PAGE_SIZE_ITEMS,
            pageNumber: 1,
            socialLinks: true
        }).productList;
        res.render('/wishlist/shareViewWishlist', {
            wishlist: wishlistModel,
            breadcrumbs: breadcrumbs,
            loggedIn: loggedIn,
            firstName: firstName,
            publicOption: false,
            privateList: false,
            errorMsg: '',
            socialLinks: true,
            shareLink: true
        });
    } else {
        res.render('/wishlist/shareViewWishlist', {
            wishlist: null,
            breadcrumbs: breadcrumbs,
            loggedIn: loggedIn,
            privateList: true,
            errorMsg: Resource.msg(
                'wishlist.not.viewable.text',
                'wishlist',
                null
            ),
            socialLinks: false,
            shareLink: false
        });
    }
    next();
});

module.exports = server.exports();
