'use strict';

var server = require('server');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');

server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var list = productListHelper.getCurrentOrNewList(req.currentCustomer.raw, {
        type: 10
    });
    var pid = req.querystring.pid || req.form.pid;
    var optionId = req.querystring.optionId || req.form.optionId  || null;
    var optionVal = req.querystring.optionVal || req.form.optionVal || null;

    var config = {
        qty: 1,
        optionId: optionId,
        optionValue: optionVal,
        req: req,
        type: 10
    };
    var itemExist = productListHelper.itemExists(list, pid, config);

    var viewData = res.getViewData();
    var currentPageMeta = viewData.CurrentPageMetaData || {};
    currentPageMeta.description = (
        viewData.product.fragranceDescription ||
        viewData.product.shortDescription ||
        viewData.product.longDescription
    );
    currentPageMeta.pageMetaTags = currentPageMeta.pageMetaTags || [];
    if (currentPageMeta.description) {
        currentPageMeta.pageMetaTags.push({
            content: currentPageMeta.description,
            ID: 'og:description',
            name: false,
            property: true,
            title: false
        });
    }
    var removeLineItemURL = URLUtils.url('Giftcard-RemoveLineItems');
    var userEmail = req.currentCustomer.raw.registered
        ? req.currentCustomer.profile.email
        : false;
    var productRecord = CustomObjectMgr.getCustomObject(
        'notifyBackInStock',
        pid
    );
    var productPresentInNotifyList = false;
    if (
        (userEmail) && (productRecord !== null) &&
        productRecord.custom.user.indexOf(userEmail) !== -1
    ) {
        productPresentInNotifyList = true;
    }

    res.setViewData({
        productPresentInNotifyList:productPresentInNotifyList,
        itemExist: itemExist,
        CurrentPageMetaData: currentPageMeta,
        removeLineItemURL: removeLineItemURL
    });
    next();
});

server.prepend('Show', function (req, res, next) {
    var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
    var URLUtils = require('dw/web/URLUtils');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var recepientForm = server.forms.getForm('recipients');
    var months = qwikcilverHelpers.getMonths();
    var days = qwikcilverHelpers.getNoOfDaysOfMonth();
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var removeLineItemURL = URLUtils.url('Giftcard-RemoveLineItems');
    var giftCard = ProductFactory.get({pid: req.querystring.pid});

    res.setViewData({
        giftCard: giftCard,
        recepientForm: recepientForm,
        months: months,
        days: days,
        addToCartUrl: addToCartUrl,
        removeLineItemURL: removeLineItemURL,
        product: giftCard
    });
    next();
});

server.append('ShowQuickView', function (req, res, next) {
    var list = productListHelper.getCurrentOrNewList(req.currentCustomer.raw, {
        type: 10
    });
    var pid = req.querystring.pid || req.form.pid;
    var optionId = req.querystring.optionId || req.form.optionId  || null;
    var optionVal = req.querystring.optionVal || req.form.optionVal || null;

    var config = {
        qty: 1,
        optionId: optionId,
        optionValue: optionVal,
        req: req,
        type: 10
    };
    var itemExist = productListHelper.itemExists(list, pid, config);
    res.setViewData({itemExist: itemExist});
    next();
});

module.exports = server.exports();
