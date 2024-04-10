'use strict';

var server = require('server');
server.extend(module.superModule);

/**
 * Product-Variation : This endpoint is called when all the product variants are selected
 * @function
 * @param {querystringparameter} pid - Product ID
 * @param {querystringparameter} quantity - Quantity
 * @param {querystringparameter} color - Color Attribute ID
 * @param {querystringparameter} size - Size Attribute ID
 */
server.append('Variation', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var viewData = res.getViewData();
    var addToCartUrl = URLUtils.url('Cart-AddProduct');

    var addToCartContext = {
        product: viewData.product,
        addToCartUrl: addToCartUrl
    };
    var addToCartTemplate = 'product/components/addToCartProduct';
    if (!viewData.product.isMaster && !viewData.product.available) {
        addToCartTemplate = 'product/components/notifyMe';
    }

    viewData.product.addToCartHtml = renderTemplateHelper.getRenderedHtml(
        addToCartContext,
        addToCartTemplate
    );

    viewData.isAjaxCall = true;

    res.setViewData(viewData);

    next();
});
module.exports = server.exports();
