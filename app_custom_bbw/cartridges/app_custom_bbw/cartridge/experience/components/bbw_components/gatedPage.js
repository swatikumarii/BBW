
'use strict';

// Global response
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Render logic for storefront.imageAndText component.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge.
 * This will not be passed in by Commerce Cloud Platform.
 * @returns {string} The markup to be displayed
 */

module.exports.render = function (context, modelIn) {
    var model = modelIn || new HashMap();
    var content = context.content;
    model.customObjectID =content.customObjectID;

    return new Template('experience/components/bbw_components/gatedPage').render(model).text;
};
