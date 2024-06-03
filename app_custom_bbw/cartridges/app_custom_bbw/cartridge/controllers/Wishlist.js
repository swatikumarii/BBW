'use strict';

var server = require('server');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
var seo = require('*/cartridge/scripts/middleware/seo');

var PAGE_SIZE_ITEMS = 1000;

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
server.replace('Show', function (req, res, next) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var list = productListHelper.getList(req.currentCustomer.raw, {
        type: 10
    });
    var WishlistModel = require('*/cartridge/models/productList');
    var userName = '';
    var firstName;
    var rememberMe = false;
    if (req.currentCustomer.credentials) {
        rememberMe = true;
        userName = req.currentCustomer.credentials.username;
    }
    var loggedIn = req.currentCustomer.profile;

    var target = req.querystring.rurl || 1;
    var actionUrl = URLUtils.url('Account-Login');
    var createAccountUrl = URLUtils.url(
        'Account-SubmitRegistration',
        'rurl',
        target
    )
        .relative()
        .toString();
    var navTabValue = req.querystring.action;
    var breadcrumbs;
    if (loggedIn) {
        firstName = req.currentCustomer.profile.firstName;
        breadcrumbs = [{
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
    } else {
        breadcrumbs = [{
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        },
        {
            htmlValue: Resource.msg('label.signin.name', 'login', null)
        }
        ];
    }

    var userEmail = req.currentCustomer.raw.registered ? req.currentCustomer.profile.email : false;

    var profileForm = server.forms.getForm('profile');
    profileForm.clear();
    var wishlistModel = new WishlistModel(list, {
        type: 'wishlist',
        publicView: false,
        pageSize: PAGE_SIZE_ITEMS,
        pageNumber: 1
    }).productList;

    if (wishlistModel && wishlistModel.items && wishlistModel.items.length > 0) {
        for (var index = 0; index < wishlistModel.items.length; index++) {
            var productRecord = CustomObjectMgr.getCustomObject('notifyBackInStock', wishlistModel.items[index].pid);
            wishlistModel.items[index].productPresentInNotifyList = false;
            if (userEmail && productRecord !== null && productRecord.custom.user.indexOf(userEmail) !== -1) {
                wishlistModel.items[index].productPresentInNotifyList = true;
            }
        }
    }

    res.render('/wishlist/wishlistLanding', {
        wishlist: wishlistModel,
        navTabValue: navTabValue || 'login',
        rememberMe: rememberMe,
        userName: userName,
        actionUrl: actionUrl,
        actionUrls: {
            updateQuantityUrl: ''
        },
        profileForm: profileForm,
        breadcrumbs: breadcrumbs,
        oAuthReentryEndpoint: 1,
        loggedIn: loggedIn,
        firstName: firstName,
        socialLinks: loggedIn,
        publicOption: loggedIn,
        createAccountUrl: createAccountUrl
    });
    next();
}, seo.addCurrentPageMetaData);

server.replace('ShowOthers', function (req, res, next) {
    var id = req.querystring.id;
    var productListMgr = require('dw/customer/ProductListMgr');
    var apiList = productListMgr.getProductList(id);
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
        var firstName = apiList.owner.profile.firstName;
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
}, seo.addCurrentPageMetaData);

module.exports = server.exports();
