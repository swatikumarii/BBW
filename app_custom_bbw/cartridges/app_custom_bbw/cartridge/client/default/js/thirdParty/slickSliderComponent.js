'use strict';

var $ = require('jquery');
require('slick-carousel');
var debounce = require('lodash/debounce');

window.addEventListener('orientationchange', debounce(function () {}, 600));

// Window Resize - Function
$(window).on('resize', debounce(function () {}, 500));

/**
 * Simple PD - Slick Slider
 */
if ($('body').find('.js-slider').length > 0) {
    $('.js-slider').each(function () {
        var e = $(this).attr('id');
        var slider = $('#' + e);
        var slideToShowDesktop = slider.data('slide-to-show-dekstop');
        var slideToShowMobile = slider.data('slide-to-show-mobile');
        var infiniteLoop = slider.data('slick-loop');
        var autoPlay = slider.data('auto-play');
        var autoPlaySpeed = slider.data('autoplay-speed') * 1000;
        var displayIndicators = slider.data('custom-indicator');
        var dotsNavigation = slider.data('custom-dots');
        var slideAnimation = '';
        if (slider.data('slide-animation') === 'Fade') {
            slideAnimation = true;
        }
        if (slider.data('slide-animation') === 'Normal') {
            slideAnimation = false;
        }

        slider.slick({
            accessibility: true,
            appendDots: slider.parents('.js-slick-slider-section').find('.slider-dots'),
            dots: dotsNavigation,
            arrows: displayIndicators,
            infinite: infiniteLoop,
            draggable: true,
            autoplay: autoPlay,
            slidesToShow: slideToShowDesktop,
            pauseOnHover: true,
            variableWidth: false,
            pauseOnFocus: true,
            pauseOnDotsHover: true,
            swipeToSlide: true,
            touchThreshold: 500,
            fade: slideAnimation,
            prevArrow: '<div class="slick-prev"><button type="button" class="btn--stripped icon-arrow3--left slider-button slider-prev"><span aria-label="Previous">‹</span></button></div>',
            nextArrow: '<div class="slick-next"><button type="button" class="btn--stripped icon-arrow3--right slider-button slider-next"><span aria-label="Next">›</span></button></div>',
            lazyLoad: 'progressive',
            speed: 300,
            autoplaySpeed: autoPlaySpeed,
            responsive: [{
                breakpoint: 767,
                settings: {
                    autoplay: autoPlay,
                    autoplaySpeed: autoPlaySpeed,
                    slidesToShow: slideToShowMobile,
                    arrows: displayIndicators,
                    fade: slideAnimation
                }
            }]
        });
    });
}
