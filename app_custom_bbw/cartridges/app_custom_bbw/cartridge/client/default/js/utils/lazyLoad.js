'use strict';

// Vanilla Lazy Load
var LazyLoad = require('vanilla-lazyload/dist/lazyload.min');
var helpers = require('../utils/helpers');

/**
 * Loazy load js
 */
function init() {
    var lazyLoadInstance = new LazyLoad({
        elements_selector: '.lazy', // eslint-disable-line
        threshold: '5',
        class_loading: 'lazy-loading', // eslint-disable-line
        restore_on_error: true, // eslint-disable-line
        callback_loading: function () {
            // eslint-disable-line
            // Find the skeleton loader and show it
            var lazyImage = $('.lazy-loading');
            if (lazyImage.length > 0) {
                var skeletonLoader = lazyImage
                    .closest('.lazy-skeleton')
                    .next('.skeleton-loader');
                if (skeletonLoader.length > 0) {
                    skeletonLoader.show(); // Show the skeleton loader
                }
            }
        },
        callback_loaded: function (element) {
            // eslint-disable-line
            // Find the skeleton loader and hide it
            var loadedImage = $('.lazy.loaded');
            if (loadedImage.length > 0) {
                var skeletonLoader = $(element)
                    .closest('.lazy-skeleton')
                    .find('.skeleton-loader');
                if (skeletonLoader.length > 0) {
                    skeletonLoader.hide(); // Hide the skeleton loader
                }
            }
        },
        callback_error: function (element) {
            // eslint-disable-line
            // Find the skeleton loader and hide it
            var loadedImageError = $('.lazy.error');
            if (loadedImageError.length > 0) {
                var skeletonLoader = loadedImageError
                    .closest('.lazy-skeleton')
                    .find('.skeleton-loader');
                if (skeletonLoader.length > 0) {
                    skeletonLoader.hide(); // Hide the skeleton loader
                }
            }
        }
    });
    lazyLoadInstance.update();
}

/**
 *
 */
function elementHeight() {
    var elementsToSync = [
        '.b-product-tile__badge',
        '.b-product-tile__link',
        '.b-product-tile__name',
        '.b-product-tile__product-type',
        '.b-product-tile__img-wrapper',
        '.tile-body',
        '.price',
        '.js-product-tile',
        '.js-product-tile-promo',
        '.js-promo-wrapper',
        '.js-product-tile-price',
        '.js-product-tile-badge'
    ];
    var pickedJustyouContainers = $('.js-picked-just-recomm');

    for (var t = 0; t < pickedJustyouContainers.length; t++) {
        var pickedJustyouSlide = $(pickedJustyouContainers[t]).find(
            '.js-picked-just-recomm-item'
        );
        helpers.syncProductTileParts(pickedJustyouSlide, elementsToSync);
    }
}

var targetElement = document.getElementById('maincontent');
var observerRec = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        var mutationId = $(mutation.target).attr('id');
        // Check if the target element contains the specific element
        if (
            $(mutation.target).find('[id^="cq_recomm_slot-"]').length > 0 ||
            (mutationId &&
                mutationId !== 'undefined' &&
                mutationId.includes('cq_recomm_slot-'))
        ) {
            init();
            elementHeight();
        }
    });
});

var config = {
    childList: true,
    subtree: true
};

observerRec.observe(targetElement, config);

/**
 * lazyLoadSlotOnId
 * @param {string} id - Slot id in which we want to load images with lazy load
 */
function lazyLoadSlotOnId(id) {
    var element = document.getElementById(id);
    if (element) {
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                var mutationId = $(mutation.target).attr('id');
                // Check if the target element contains the specific element
                if (
                    $(mutation.target).find('[id^="cq_recomm_slot-"]').length >
                        0 ||
                    (mutationId &&
                        mutationId !== 'undefined' &&
                        mutationId.includes('cq_recomm_slot-'))
                ) {
                    init();
                    elementHeight();
                }
            });
        });

        observer.observe(element, {
            childList: true,
            subtree: true
        });
    }
}

module.exports = {
    lazyLoad: init,
    lazyLoadSlotOnId: lazyLoadSlotOnId
};
