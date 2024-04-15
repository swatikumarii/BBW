var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');

/**
 * Render logic for storefront to get content Asset in Page designer
 * @param {dw.experience.ComponentScriptContext} context The component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commcerce Cloud Plattform.
 * @returns {string} The markup to be displayed
 */

module.exports.render = function (context) {
    var model = new HashMap();
    var component = context.component;
    var content = context.content;

    model.title = content.title ? content.title : '';
    model.customClass = content.customClass ? content.customClass : '';

    model.columnGapDesktop = content.columnGapDesktop;
    model.columnGapMobile = content.columnGapMobile;
    model.columnGapTablet = content.columnGapTablet;

    model.regions = PageRenderHelper.getRegionModelRegistry(component);

    return new Template('experience/components/commerce_layouts/topOfferSwiper').render(model).text;
};
