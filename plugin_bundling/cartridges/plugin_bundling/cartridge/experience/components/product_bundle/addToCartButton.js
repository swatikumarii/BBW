'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Render logic for bundle add to cart button
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @returns {string} The template to be displayed
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;
    var bundle = JSON.parse(session.custom.bundle);
    var position = bundle.name.indexOf(session.custom.currentBundle);
    model.isBundleAvailable = !bundle.oos[position];
    model.buyLimit = content.bundleBuyLimit;
    model.oosContetnt = content.oosContetnt;
    bundle.buyLimit[position] = content.bundleBuyLimit;
    session.custom.bundle = JSON.stringify(bundle);
    return new Template('experience/components/product_bundle/components/addToCartButton').render(model).text;
};
