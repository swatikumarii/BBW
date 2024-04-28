'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var ProductFactory = require('*/cartridge/scripts/factories/product');
var base = require('app_storefront_base/cartridge/scripts/cart/cartHelpers');
var URLUtils = require('dw/web/URLUtils');

/**
 * Render logic for product bundle
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @returns {string} The template to be displayed
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var BasketMgr = require('dw/order/BasketMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var content = context.content;
    model.title = content.title;
    model.imageURL = content.imageURL;
    model.image = content.image;
    model.desktopTiles = (12 / content.desktopTiles).toFixed(0);
    model.showPrice = content.showPrice;
    var productIds = content.productID.split(',');
    var products = [];
    var counter = -1;
    var availableProducts = 0;
    var totalQtyRequested = 0;
    var productLineItems = null;
    var canBeAdded = false;
    var perpetual;
    if (currentBasket) {
        productLineItems = currentBasket.productLineItems;
    }
    while (++counter < productIds.length) {
        var product = ProductFactory.get({ pid: productIds[counter].trim() });
        var productObj = ProductMgr.getProduct(product.id);
        var quantityInCart = 0;
        canBeAdded = false;
        if (productLineItems) {
            quantityInCart = base.getQtyAlreadyInCart(product.id, productLineItems);
        }
        totalQtyRequested = 1 + quantityInCart;
        perpetual = productObj.availabilityModel.inventoryRecord.perpetual;
        canBeAdded =
            (perpetual
                || totalQtyRequested <= productObj.availabilityModel.inventoryRecord.ATS.value);
        if (product.available) {
            product.canBeAdded = canBeAdded;
            products.push(product);
            ++availableProducts;
        }
    }
    // check if bundle can be render or not
    if (!availableProducts) {
        var bundle = JSON.parse(session.custom.bundle);
        var position = bundle.name.indexOf(session.custom.currentBundle);
        ++bundle.oos[position];
        // update bundle
        session.custom.bundle = JSON.stringify(bundle);
    }
    model.products = products;
    model.id = Date.now().toString();
    model.url = URLUtils.url('ProductBundle-Show').toString();

    return new Template('experience/components/product_bundle/multiProduct').render(model).text;
};
