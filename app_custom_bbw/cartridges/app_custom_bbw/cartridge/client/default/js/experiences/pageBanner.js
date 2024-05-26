'use strict';

var debounce = require('lodash/debounce');

/**
 * Check - In viewport - Return - true/false
 * @returns {boolean} Return - true/false
 * @param {object} e  Element object
 * @param {string} t  String value
 */
function viewportCheck(e, t) {
    if (!e) return !1;
    var w = $(window).scrollTop();
    var r = w + $(window).height();
    var i = $(e).offset().top;
    var a = i + $(e).height();
    var o = $(window).scrollLeft();
    var s = o + $(window).width();
    var l = $(e).offset().left;
    var c = l + $(e).width();
    return !0 === t ? w < i && a < r && o < l && c < s : i <= r && w <= a && l <= s && o <= c;
}

/**
 * Mobile devices - Max-width 767
 * @returns {boolean} Return - true/false
 */
function mobileView() {
    var e = $(window).width();
    return e <= 767;
}

/**
 * Tablet devices - Min-width 768 to 825
 * @returns {boolean} Return - true/false
 */
function tabletView() {
    var e = $(window).width();
    return e >= 768 && e <= 825;
}

/**
 * Tablet LandScape devices -  Max width - 1024
 * @returns {boolean} Return - true/false
 */
function tabletLandScape() {
    var e = $(window).width();
    return e >= 826 && e <= 1024;
}

/**
 * Video Play - Function
 * @param {object} e Element object
 */
function videoPlay(e) {
    if (e) {
        $('video', e)[0].play();
    }
}

/**
 * Video Pause - Function
 * @param {object} e Element object
 */
function videoPause(e) {
    if (e) {
        $('video', e)[0].pause();
    }
}

$(window).on('resize', debounce(function () {
    if ($('body').find('.js-banner-image')) {
        var is2X = window.devicePixelRatio >= 2;
        $('.js-banner-image').each(function () {
            if ($(window).width() < 768) {
                var mobileBannerImage =
                    (is2X ? $(this).data('mobilev-2x') : null) ||
                    $(this).data('mobilev');
                if (mobileBannerImage) {
                    $(this).css('background-image', 'url(' + mobileBannerImage + ')');
                }
            } else if (tabletView() || tabletLandScape()) {
                var tabletBannerImage =
                    (is2X ? $(this).data('tabletv-2x') : null) ||
                    $(this).data('tabletv');
                if (tabletBannerImage) {
                    $(this).css('background-image', 'url(' + tabletBannerImage + ')');
                }
            } else {
                var desktopBannerImage =
                    (is2X ? $(this).data('desktopv-2x') : null) ||
                    $(this).data('desktopv');
                if (desktopBannerImage) {
                    $(this).css('background-image', 'url(' + desktopBannerImage + ')');
                }
            }
        });
    }
    if ($('.js-bannersmall-video').length > 0) {
        $('.js-bannersmall-video').each(function () {
            if (mobileView()) {
                $(this).find('source').attr('src', $(this).find('source').data('mobilev'));
            } else if (tabletView() || tabletLandScape()) {
                $(this).find('source').attr('src', $(this).find('source').data('tabletv'));
            } else {
                $(this).find('source').attr('src', $(this).find('source').data('desktopv'));
            }
            $(this)[0].load();
        });
    }
}, 500));

$(document).ready(function () {
    /**
     * Video Button Click Event
     */
    $('.js-responsive-video-control-button').each(function () {
        $(this).on('click', function () {
            var e = $(this).data('target');
            var t = $(this).closest('.js-responsive-video-controls');
            if ($(t).hasClass('is-playing')) {
                $(t).addClass('was-paused');
                $(t).removeClass('is-playing');
                videoPause(e);
            } else {
                $(t).removeClass('was-paused');
                $(t).addClass('is-playing');
                videoPlay(e);
            }
        });
    });

    /**
     *  Video Sound Button Click Event
     */
    $('.js-responsive-vol-control-button').each(function () {
        $(this).on('click', function () {
            var e = $(this).data('btn-id');
            if ($('#' + e).hasClass('unmuted')) {
                if ($('[data-btn-id="' + e + '"] .icon-sound').hasClass('sound-off')) {
                    $('[data-btn-id="' + e + '"]').find('.icon-sound').removeClass('sound-off').addClass('sound-on');
                    $('#' + e).prop('muted', false);
                } else {
                    $('[data-btn-id="' + e + '"]').find('.icon-sound').removeClass('sound-on').addClass('sound-off');
                    $('#' + e).prop('muted', true);
                }
            }
        });
    });

    // PageBanner slide Change Event
    $('.pd-slick-slider').each(function () {
        if ($(this).find('.experience-rituals_components-pageBanner').length > 0) {
            // Slider Id
            var sliderId = $(this).attr('id');
            $('#' + sliderId).on('beforeChange', function (event, slick, currentSlide, nextSlide) {
                if ($(this).find('.slick-slide[data-slick-index="' + currentSlide + '"] .js-video-holder').length > 0) {

                    // Current Slide Video Id
                    var videoId = $(this).find('.slick-slide[data-slick-index="' + currentSlide + '"] .experience-rituals_components-pageBanner .js-responsive-vol-controls .js-responsive-vol-control-button').data('btn-id');

                    if (!$('[data-btn-id="' + videoId + '"] .icon-sound').hasClass('sound-off')) {
                        $('[data-btn-id="' + videoId + '"]').find('.icon-sound').removeClass('sound-on').addClass('sound-off');

                        // Mute Video Before Slide Change
                        $('#' + videoId).prop('muted', true);
                    }
                }
                if ($(this).find('.slick-slide[data-slick-index="' + nextSlide + '"] .js-video-holder').length > 0) {
                    if (!$(this).find('.slick-slide[data-slick-index="' + nextSlide + '"] .experience-rituals_components-pageBanner .js-responsive-video-controls').hasClass('is-playing')) {
                        var e = $(this).find('.slick-slide[data-slick-index="' + nextSlide + '"] .experience-rituals_components-pageBanner .js-responsive-video-controls .js-responsive-video-control-button').data('target');

                        // Add Class for Video Playing
                        $(this).find('.slick-slide[data-slick-index="' + nextSlide + '"] .experience-rituals_components-pageBanner .js-responsive-video-controls').addClass('is-playing');

                        // Play Next Slide Video
                        videoPlay(e);
                    }
                }
            });
        }
    });

    var dataArray = [];
    $('.js-responsive-video').each(function () {
        var n;
        var q = this;
        var opts = $(q).data('responsive-video-options');

        if (!((!mobileView() || opts.hideOnMobile) && (mobileView() || opts.hideOnDesktop) || opts.skipOnLoad)) {
            dataArray[opts.id] = q;
        }
        if (opts.playWhenInView) {
            n = q;
            $(window).on('load scroll', debounce(function () {
                var e = $(n).parents('.js-banner-wrapper').find('.video-controls-wrapper .js-responsive-video-controls');
                var t = $(n).parent().css('opacity') === '0';
                if (viewportCheck(n, 0) && !t) {
                    if (!(e.hasClass('was-paused') || e.hasClass('is-playing'))) {
                        videoPlay(n);
                        e.addClass('is-playing');
                    } else if (e.hasClass('was-paused')) {
                        e.removeClass('was-paused').addClass('is-playing');
                        videoPlay(n);
                    }
                } else {
                    videoPause(n);
                    e.removeClass('is-playing');
                }
            }, 700));
        }
    });

    /*
     * Banner - Image Changes Function
     */
    if ($('body').find('.js-banner-image')) {
        var is2X = window.devicePixelRatio >= 2;
        $('.js-banner-image').each(function () {
            if ($(window).width() < 768) {
                var mobileBannerImage =
                    (is2X ? $(this).data('mobilev-2x') : null) || $(this).data('mobilev');
                if (mobileBannerImage) {
                    $(this).css('background-image', 'url(' + mobileBannerImage + ')');
                }
            } else if (tabletView() || tabletLandScape()) {
                var tabletBannerImage = (is2X ? $(this).data('tabletv-2x') : null) || $(this).data('tabletv');
                if (tabletBannerImage) {
                    $(this).css('background-image', 'url(' + tabletBannerImage + ')');
                }
            } else {
                var desktopBannerImage =
                    (is2X ? $(this).data('desktopv-2x') : null) ||
                    $(this).data('desktopv');
                if (desktopBannerImage) {
                    $(this).css('background-image', 'url(' + desktopBannerImage + ')');
                }
            }
        });
    }

    /*
     * Banner - Video Chnages Function
     */
    if ($('.js-bannersmall-video').length > 0) {
        $('.js-bannersmall-video').each(function () {
            if (mobileView()) {
                $(this).find('source').attr('src', $(this).find('source').data('mobilev'));
            } else if (tabletView() || tabletLandScape()) {
                $(this).find('source').attr('src', $(this).find('source').data('tabletv'));
            } else {
                $(this).find('source').attr('src', $(this).find('source').data('desktopv'));
            }
            $(this)[0].load();
        });
    }

    // Creating dynamic breadcrumb for page designer page
    var pageName = $('#pageName').val();
    var existingBreadcrumb = $('.pagedesigner-breadcrumb').length;
    var appendBreadcrumb = '<span class="page-name hidden-md-down"><span>' + pageName + '</span></span>';
    if (existingBreadcrumb > 0) {
        $('.pagedesigner-breadcrumb').append('<span class="link-sep hidden-md-down"> - </span>');
        $('.pagedesigner-breadcrumb').append(appendBreadcrumb);
    }
});

$(window).on('load', function () {
    $('.experience-rituals_components-pageBanner .content-banner').removeClass('not-in-viewport');
});
