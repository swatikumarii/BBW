'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');

/**
 * Render logic for storefront.carousel layout.
 * @param {dw.experience.ComponentScriptContext} context The component script context object.
 * @param {dw.experience.ComponentScriptContext} modelIn .
 * @returns {string} The template to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = modelIn || new HashMap();

    var content = context.content;
    var component = context.component;

    model.displayIndicators = content.CarouselIndicators ? 'true' : 'false';

    model.displayControls = content.CarouselControls ? 'true' : 'false';

    model.infinityLoop = content.infinityLoop ? 'true' : 'false';

    model.autoplay = content.autoplay ? 'true' : 'false';
    model.autoPlaySpeed = content.autoPlaySpeed ? content.autoPlaySpeed : 3;

    model.slideAnimation = content.slideAnimation ? content.slideAnimation : '';

    model.arrowStyle = content.arrowStyle ? content.arrowStyle : 'default';

    model.sliderCustomClass = content.sliderCustomClass ? content.sliderCustomClass : '';

    model.slideToShowMobile = content.slideToShowMobile ? content.slideToShowMobile : null;
    model.slideToShowDesktop = content.slideToShowDesktop ? content.slideToShowDesktop : null;
    model.gapMobile = content.gapMobile ? content.gapMobile : 0;
    model.gapDesktop = content.gapDesktop ? content.gapDesktop : 0;

    model.regions = PageRenderHelper.getRegionModelRegistry(component);
    model.showOutOfStockProducts = content.showOutOfStockProducts;

    return new Template('experience/components/commerce_assets/slickSlider').render(model).text;
};
