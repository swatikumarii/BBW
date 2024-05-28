'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');

/**
 * Render logic for the custom.gridLayout component.
 * @param {dw.experience.ComponentScriptContext} context The component script context object.
 * @returns {string} The rendered HTML string.
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var component = context.component;
    var content = context.content;

    // Mobile Grid Config
    model.itemsPerRowMobile = content.itemsPerRowMobile;
    model.rowGapMobile = content.rowGapMobile;
    model.columnGapMobile = content.columnGapMobile;

    // Desktop Grid Config
    model.itemsPerRowDesktop = content.itemsPerRowDesktop;
    model.columnGapDesktop = content.columnGapDesktop;
    model.rowGapDesktop = content.rowGapDesktop;

    // Tablet Grid Config
    model.itemsPerRowTablet = content.itemsPerRowTablet;
    model.columnGapTablet = content.columnGapTablet;
    model.rowGapTablet = content.rowGapTablet;

    model.gridSectionClass = content.gridSectionClass;
    model.rowCustomClass = content.rowCustomClass ? content.rowCustomClass: '';
    model.columnCustomClass = content.columnCustomClass ? content.columnCustomClass : '';
    model.title = content.title ? content.title : '' ;

    // Bacground Images
    model.girdBgDesktop = content.girdBgDesktop ? ImageTransformation.getScaledImage(content.girdBgDesktop) : '';
    model.girdBgTablet = content.girdBgTablet ? ImageTransformation.getScaledImage(content.girdBgTablet) : '';
    model.girdBgMobile = content.girdBgMobile ? ImageTransformation.getScaledImage(content.girdBgMobile) : '';


    model.regions = PageRenderHelper.getRegionModelRegistry(component);

    return new Template('experience/components/commerce_layouts/grid').render(model).text;
};
