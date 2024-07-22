'use strict';

/**
 * @namespace Tile
 */

var server = require('server');
server.extend(module.superModule);

/**
 * Tile-Show : Used to return data for rendering a product tile
 */
server.append(
    'Show',
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var BasketMgr = require('dw/order/BasketMgr');
        var ProductMgr = require('dw/catalog/ProductMgr');
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        var viewData = res.getViewData();
        if (req.querystring.cgid) {
            if (!viewData.product.isEgiftCard) {
                viewData.urls.product = URLUtils.url('Product-Show', 'pid', viewData.product.id, 'cat', req.querystring.cgid);
            }
        }
        var qtyAlreadyInCartPID = 0;
        var currentBasket = BasketMgr.getCurrentBasket();
        var productLineItems = currentBasket && currentBasket.productLineItems;
        if (productLineItems) {
            qtyAlreadyInCartPID = cartHelper.getQtyAlreadyInCart(
                viewData.product.id,
                productLineItems
            );
            viewData.product.qtyAlreadyInCart = qtyAlreadyInCartPID;
        }
        var product = ProductMgr.getProduct(viewData.product.id);
        var productValidationHelpers = require('*/cartridge/scripts/helpers/productValidationHelpers');
        var maxOrderQty = productValidationHelpers.getProductMaxOrderQty(product);
        viewData.product.maxOrderQty = maxOrderQty;
        res.setViewData(viewData);
        next();
    }
);

/**
 * This route is only for email recommendation tile
 */
server.get(
    'EmailShow',
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var ProductFactory = require('*/cartridge/scripts/factories/product');

        var productTileParams = { pview: 'tile' };
        Object.keys(req.querystring).forEach(function (key) {
            productTileParams[key] = req.querystring[key];
        });

        var product;
        var productUrl;

        try {
            product = ProductFactory.get(productTileParams);
            productUrl = URLUtils.abs('Product-Show', 'pid', product.id)
                .toString();
        } catch (e) {
            product = false;
            productUrl = URLUtils.abs('Home-Show');
        }

        var context = {
            product: product,
            urls: {
                product: productUrl
            }
        };

        res.render('product/productEmailTile.isml', context);

        next();
    }
);

module.exports = server.exports();
