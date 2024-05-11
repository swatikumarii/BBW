'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');

/**
 * Render logic for storefront.imageAndText component.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 * @returns {string} The markup to be displayed
 */

module.exports.render = function (context, modelIn) {
    var model = modelIn || new HashMap();
    var content = context.content;
    var imagePositionClass = content.selectImagePosition;

    model.imagePositionClass = imagePositionClass;
    model.mobileImage = content.mobile_image ? ImageTransformation.getScaledImage(content.mobile_image) : null;
    model.desktopImage = content.desktop_image ? ImageTransformation.getScaledImage(content.desktop_image) : null;
    model.useImgURL = !!content.useImgURL;
    model.disableLazyLoad = !!content.disableLazyLoad;
    model.desktopImgUrl = content.desktopImgUrl ? content.desktopImgUrl : null;
    model.mobileImgUrl = content.mobileImgUrl ? content.mobileImgUrl : null;
    model.alt = content.alt ? content.alt : '';
    model.offersUrgency = content.offersUrgency ? content.offersUrgency : null;
    model.offersCategory = content.offersCategory ? content.offersCategory : null;
    model.offersPrice = content.offersPrice ? content.offersPrice : null;
    model.offersDetails = content.offersDetails ? content.offersDetails : null;
    model.linkUmpParameter = content.linkUmpParameter ? content.linkUmpParameter : '';
    model.link = content.link ? content.link : '#';
    model.customClass = content.customClass ? content.customClass : '';

    return new Template('experience/components/bbw_components/cardOffer').render(model).text;
};
