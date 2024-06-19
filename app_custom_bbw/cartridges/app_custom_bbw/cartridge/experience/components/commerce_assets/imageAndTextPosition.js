'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');

/**
 * get image path for srcset
 * @param {boolean} useImgURL - use image url or not
 * @param {string} imgUrl - image url
 * @param {string} image - image
 * @param {string} imgUrl2X - image url
 * @param {string} image2X - image
 * @param {string} type - device type
 * @returns {string} imageSrc
 */
function get2XImageString(
    useImgURL,
    imgUrl,
    image,
    imgUrl2X,
    image2X,
    type
) {
    var imageSrc = '';
    if (useImgURL) {
        if (imgUrl) {
            imageSrc = imgUrl;
        }
        if (imgUrl2X) {
            imageSrc += ' 1x, ' + imgUrl2X + ' 2x';
        }
    } else {
        if (image) {
            imageSrc = ImageTransformation.getScaledImage(image).src[type];
        }
        if (image2X) {
            imageSrc +=
                ' 1x, ' +
                ImageTransformation.getScaledImage(image2X).src[type] +
                ' 2x';
        }
    }
    return imageSrc;
}
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
    model.mobileImageSrcset = get2XImageString(
        !!content.useImgURL,
        content.mobileImgUrl,
        content.mobile_image,
        content.mobileImgUrl2X,
        content.mobile_image2X,
        'mobile'
    );
    model.desktopImageSrcset = get2XImageString(
        !!content.useImgURL,
        content.desktopImgUrl,
        content.desktop_image,
        content.desktopImgUrl2X,
        content.desktop_image2X,
        'desktop'
    );
    model.useImgURL = !!content.useImgURL;
    model.disableLazyLoad = !!content.disableLazyLoad;
    model.enableLoader = !!content.enableLoader;
    model.desktopImgUrl = content.desktopImgUrl ? content.desktopImgUrl : null;
    model.mobileImgUrl = content.mobileImgUrl ? content.mobileImgUrl : null;
    model.alt = content.alt ? content.alt : '';
    model.description = content.description ? content.description : null;
    model.linkText = content.linkText ? content.linkText : null;
    model.linkUmpParameter = content.linkUmpParameter ? content.linkUmpParameter : '';
    model.link = content.link ? content.link : '#';
    model.customClass = content.customClass ? content.customClass : '';
    model.trackerClass = content.trackerClass ? content.trackerClass : '';

    return new Template('experience/components/commerce_assets/imageAndTextPosition').render(model).text;
};
