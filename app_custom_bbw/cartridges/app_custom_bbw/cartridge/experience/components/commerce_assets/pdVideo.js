'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');

/**
 * Render logic for the component.endscene.
 * @param {dw.experience.ComponentScriptContext} context The component script context object.
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context) {
    var model = new HashMap();
    var content = context.content;
    model.id = 'video-' + context.component.getID();

    model.videoUrl = content.video_url;
    model.videoUrlDesktop = content.urlDesktop;

    var videoConfig = {
        autoplay: true,
        loop: true,
        muted: true,
        controls: false
    };

    if (content.optionDisableAutoplay) {
        videoConfig.autoplay = false;
    }
    if (content.optionDisableLoop) {
        videoConfig.loop = false;
    }
    if (content.optionEnableControls) {
        videoConfig.controls = true;
    }
    if (content.optionEnableSound) {
        videoConfig.muted = false;
    }

    model.videoConfig = videoConfig;

    if (content.img) {
        model.img = ImageTransformation.getScaledImage(content.img);
    }

    if (content.imgDesktop) {
        model.imgDesktop = ImageTransformation.getScaledImage(content.imgDesktop);
    }

    return new Template('experience/components/commerce_assets/pdVideo').render(model).text;
};
