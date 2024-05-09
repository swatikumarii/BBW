'use strict';

var server = require('server');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');

server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
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
    ).markup;
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
    res.setViewData({itemExist: itemExist, CurrentPageMetaData: currentPageMeta, removeLineItemURL: removeLineItemURL});
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
