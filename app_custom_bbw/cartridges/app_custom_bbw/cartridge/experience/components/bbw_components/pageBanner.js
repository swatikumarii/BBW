'use strict';

// Global response
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');

/**
 * Render logic for storefront.imageAndText component.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge.
 * This will not be passed in by Commerce Cloud Platform.
 * @returns {string} The markup to be displayed
 */

module.exports.render = function (context, modelIn) {
    var expires = new Date();
    var model = modelIn || new HashMap();
    var content = context.content;

    // Banner - Image
    model.useBannerImgURL = content.useBannerImgURL ? content.useBannerImgURL : false;

    // Desktop - Banner Image
    model.desktopBannerImageUrl = content.desktopBannerImageUrl ? content.desktopBannerImageUrl : '';
    model.desktopBannerImage = content.desktopBannerImage ? ImageTransformation.getScaledImage(content.desktopBannerImage) : '';
    model.desktopBannerOverlay = content.desktopBannerOverlay ? 'gradient-overlay-subtle' : '';

    // Tablet - Banner Image
    model.tabletBannerImageUrl = content.tabletBannerImageUrl ? content.tabletBannerImageUrl : '';
    model.tabletBannerImage = content.tabletBannerImage ? ImageTransformation.getScaledImage(content.tabletBannerImage) : '';
    model.tabletBannerOverlay = content.tabletBannerOverlay ? 'gradient-overlay-tablet' : '';

    // Mobile - Banner Image
    model.mobileBannerImageUrl = content.mobileBannerImageUrl ? content.mobileBannerImageUrl : '';
    model.mobileBannerImage = content.mobileBannerImage ? ImageTransformation.getScaledImage(content.mobileBannerImage) : '';
    model.mobileBannerOverlay = content.mobileBannerOverlay ? 'gradient-overlay-mobile' : '';

    model.bannerImgAlt = content.bannerImgAlt ? content.bannerImgAlt : '';
    model.bannerheight = content.bannerheight ? content.bannerheight : '';

    // Banner - Video
    model.videoDesktop = content.videoDesktop ? content.videoDesktop : '#';
    model.videoTablet = content.videoTablet ? content.videoTablet : '#';
    model.videoMobile = content.videoMobile ? content.videoMobile : '#';
    model.videoAlt = content.videoAlt ? content.videoAlt : '';
    model.videoLoop = content.videoLoop ? 'loop' : '';
    model.videoHideonMobile = content.videoHideonMobile ? 'hidden-md-down' : '';
    model.videoHideonTablet = content.videoHideonTablet ? 'd-md-none d-lg-block' : '';
    model.videoEnable = content.videoEnable ? 'yes' : '';
    model.videoSoundEnable = content.videoSoundEnable ? 'unmuted' : 'muted';
    model.usevideoURL = content.usevideoURL ? content.usevideoURL : '';
    model.videoFileDesktop = content.videoFileDesktop ? content.videoFileDesktop : '#';
    model.videoFileTablet = content.videoFileTablet ? content.videoFileTablet : '#';
    model.videoFileMobile = content.videoFileMobile ? content.videoFileMobile : '#';

    // Content
    model.useContentImgURL = content.useContentImgURL ? content.useContentImgURL : false;
    model.contentLogoUrl = content.contentLogoUrl ? content.contentLogoUrl : '';
    model.contentLogo = content.contentLogo ? ImageTransformation.getScaledImage(content.contentLogo) : null;

    model.contentsubTitle = content.contentsubTitle ? content.contentsubTitle : '';
    model.contenttitle = content.contenttitle ? content.contenttitle : '';
    model.contentdescription = content.contentdescription ? content.contentdescription : '';
    model.descriptionColor = content.descriptionColor ? content.descriptionColor : '';
    model.button = content.button ? content.button : '';
    model.buttonLink = content.buttonLink ? content.buttonLink : '';
    model.buttonLinkScrollId = content.buttonLinkScrollId ? content.buttonLinkScrollId : '';
    model.buttonColor = content.buttonColor ? content.buttonColor : '';
    model.contentsubTitleColor = content.contentsubTitleColor ? content.contentsubTitleColor : '';
    model.contentTitleColor = content.contentTitleColor ? content.contentTitleColor : '';

    // Other - Content
    model.customContent = content.customContent ? content.customContent : '';

    /** Content - Position */
    // Desktop - Content - Position
    model.contentPositionDesktop = content.contentPositionDesktop ? content.contentPositionDesktop : '';

    // Mobile - Content - Position
    model.contentAlignmentMobile = content.contentAlignmentMobile ? content.contentAlignmentMobile : '';
    model.contentPositionMobile = content.contentPositionMobile ? content.contentPositionMobile : '';

    // Tablet - Content - Position
    model.contentAlignmentTablet = content.contentAlignmentTablet ? content.contentAlignmentTablet : '';
    model.contentPositionTablet = content.contentPositionTablet ? content.contentPositionTablet : '';

    // Breadcrumb
    model.enableBreadcrumb = content.enableBreadcrumb ? content.enableBreadcrumb : false;

    expires.setDate(expires.getDate() + 1);
    response.setExpires(expires);
    return new Template('experience/components/bbw_components/pageBanner').render(model).text;
};
