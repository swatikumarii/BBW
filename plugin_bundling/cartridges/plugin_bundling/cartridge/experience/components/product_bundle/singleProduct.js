'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var ProductFactory = require('*/cartridge/scripts/factories/product');
var URLUtils = require('dw/web/URLUtils');

/**
 * Render logic for product bundle
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @returns {string} The template to be displayed
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var BasketMgr = require('dw/order/BasketMgr');
    var base = require('app_storefront_base/cartridge/scripts/cart/cartHelpers');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var content = context.content;
    model.product = ProductFactory.get({ pid: content.product.ID });
    model.url = URLUtils.url('ProductBundle-Show').toString();
    model.showPrice = content.showPrice;
    model.showProduct = content.showProduct;

    var quantityInCart = 0;
    var productLineItems = null;
    var canBeAdded = false;
    if(currentBasket){
        productLineItems = currentBasket.productLineItems;
        quantityInCart = base.getQtyAlreadyInCart(model.product.id, productLineItems);
    }
    var productObj = ProductMgr.getProduct(model.product.id);

    var totalQtyRequested = 1 + quantityInCart;
    var perpetual = productObj.availabilityModel.inventoryRecord.perpetual;
    canBeAdded = (perpetual || totalQtyRequested <= productObj.availabilityModel.inventoryRecord.ATS.value);

    model.product.canBeAdded = canBeAdded;
    // check if bundle is available
    if (!model.product.available || !canBeAdded) {
        var bundle = JSON.parse(session.custom.bundle);
        var position = bundle.name.indexOf(session.custom.currentBundle);
        ++bundle.oos[position];
        session.custom.bundle = JSON.stringify(bundle);
    }
    return new Template('experience/components/product_bundle/singleProduct').render(model).text;
};
