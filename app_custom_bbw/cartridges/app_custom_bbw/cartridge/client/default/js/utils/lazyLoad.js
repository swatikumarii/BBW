'use strict';

// Vanilla Lazy Load
var LazyLoad = require('vanilla-lazyload/dist/lazyload.min');
module.exports = {
    lazyLoad: function init() {
        var lazyLoadInstance = new LazyLoad({
            elements_selector: '.lazy', // eslint-disable-line
            threshold: '5',
            class_loading: 'lazy-loading', // eslint-disable-line
            restore_on_error: true, // eslint-disable-line
            callback_loading: function () { // eslint-disable-line
                // Find the skeleton loader and show it
                var lazyImage = $('.lazy-loading');
                if (lazyImage.length > 0) {
                    var skeletonLoader = lazyImage.closest('.lazy-skeleton').next('.skeleton-loader');
                    if (skeletonLoader.length > 0) {
                        skeletonLoader.show(); // Show the skeleton loader
                    }
                }

            },
            callback_loaded: function (element) { // eslint-disable-line
                // Find the skeleton loader and hide it
                var loadedImage = $('.lazy.loaded');
                if (loadedImage.length > 0) {
                    var skeletonLoader = $(element).closest('.lazy-skeleton').find('.skeleton-loader');
                    if (skeletonLoader.length > 0) {
                        skeletonLoader.hide(); // Hide the skeleton loader
                    }
                }
            },
            callback_error: function (element) { // eslint-disable-line
                // Find the skeleton loader and hide it
                var loadedImageError = $('.lazy.error');
                if (loadedImageError.length > 0) {
                    var skeletonLoader = loadedImageError.closest('.lazy-skeleton').find('.skeleton-loader');
                    if (skeletonLoader.length > 0) {
                        skeletonLoader.hide(); // Hide the skeleton loader
                    }
                }
            }
        });
        lazyLoadInstance.update();
    }
};
