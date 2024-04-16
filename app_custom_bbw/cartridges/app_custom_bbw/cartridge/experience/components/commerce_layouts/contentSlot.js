'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Render logic for storefront to get content Asset in Page designer
 * @param {dw.experience.ComponentScriptContext} context The component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commcerce Cloud Plattform.
 * @returns {string} The markup to be displayed
 */

module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;
    var contentSlotpd = content.contentSlotpd;
    model.contentSlotpd = contentSlotpd;
    return new Template('experience/components/commerce_layouts/contentSlot').render(model).text;
};
