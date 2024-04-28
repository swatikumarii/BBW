'use strict';

var helpers = require('../utils/helpers');
var layout = require('../utils/layout');
var videojsPlugin = require('video.js').default;
var videojsYoutubePlugin = require('videojs-youtube'); // eslint-disable-line
var videojsVimeoPlugin = require('@devmobiliza/videojs-vimeo/dist/videojs-vimeo.cjs'); // eslint-disable-line
var initialized = false;
var videoDefaultOptions = {
    'fluid': true,
    'controls': false,
    'muted': false,
    'autoplay': true,
    'preload': 'auto',
    'playbackRates': [0.5, 1, 1.5, 2],
    'techOrder': ['youtube', 'vimeo', 'html5'],
    'youtube': {
        'playsinline': 1
    },
    'vimeo': { 'color': '#333333', 'iv_load_policy': 3, 'ytControls': 0, 'autoplay':true },
};
var videoSrcRegex = {
    'video/youtube': /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/, // eslint-disable-line
    'video/vimeo': /(http|https)?:\/\/(www\.|player\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|video\/|)(\d+)(?:|\/\?)/, // eslint-disable-line
    'video/mp4': /https?.*?\.mp4/, // eslint-disable-line
    'video/webm': /https?.*?\.webm/ // eslint-disable-line
};

/**
 * @function
 * @description Returns video type based on url
 * @param {string} url url
 * @returns {string} ''
 */
function getVideoType(url) {
    for (var videoType in videoSrcRegex) { // eslint-disable-line
        if (url.match(videoSrcRegex[videoType])) {
            return videoType;
        }
    }
    return '';
}

/**
 * @function
 * @description initEvents
 */
function initEvents() {
    var $this = this;

    $(document).on('click', '.js-videoplay-btn', function () {
        var $playBtn = $(this);
        var config = $playBtn.data('config');
        var $container = $playBtn.closest(config.parentSelector);
        // var selector = '.js-video-el[data-id="${config.videoID}"]';
        var selector = '.js-video-el[data-id="' + config.videoID + '"]';

        if (config.videoIsInCarousel) {
            // selector = '.slick-current .js-video-el[data-id="${config.videoID}"]';
            selector = '.slick-current .js-video-el[data-id="' + config.videoID + '"]';
        }

        var videoElement = $container.find(selector)[0];

        if (videoElement && videoElement.player) {
            videoElement.player.play();
        }
    });

    $(document).on('initVideos', function (event, data) {
        $this.init({
            container: data.container
        });
    });
}

var video = {
    options: {},

    /**
     * @function
     * @description Initialize video component
     * @param {object} params additional options for component
     */
    init: function (params) {
        var $this = this;
        var $context = params && params.container ? params.container : $(document);
        var $videoItems = $context.find('.js-video');

        $this.options = $.extend({}, videoDefaultOptions, params || {});

        if ($videoItems.length > 0) {
            if (initialized) {
                $videoItems.each(function () {
                    $this.create(this, params);
                });
            } else {
                $videoItems.each(function () {
                    $this.create(this, params);
                });
                initialized = true;
            }
        }
    },

    initEvents: initEvents,

    initVideoPlugin: function ($video, videoOptions) {
        if (!videoOptions) {
            return;
        }

        // Create a copy of videoOptions
        var modifiedOptions = Object.assign({}, videoOptions);
        // Set video type if not provided
        if ('sources' in modifiedOptions && Array.isArray(modifiedOptions.sources)) {
            modifiedOptions.sources.forEach(function (source) {
                if ('src' in source && !('type' in source)) {
                    // Create a copy of the source object and modify it
                    var updatedSource = Object.assign({}, source, {
                        type: getVideoType(source.src)
                    });
                    // Replace the original source object with the modified one
                    Object.assign(source, updatedSource);
                }
            });
        }

        if (!modifiedOptions.sources || modifiedOptions.sources.length === 0 || !modifiedOptions.sources[0].type) {
            return;
        }

        if (helpers.isPlatformIOS()) {
            // Modify the copy of videoOptions
            Object.assign(modifiedOptions, {
                youtube: {
                    playsinline: 0
                }
            });
            if (modifiedOptions.sources[0].type === 'video/youtube') {
                // Autoplay doesn't work on Safari for YouTube video
                modifiedOptions.controls = true;
                modifiedOptions.autoplay = false;
            }
            if (modifiedOptions.sources[0].type === 'video/vimeo') {
                // Autoplay doesn't work on Safari for YouTube video
                modifiedOptions.controls = false;
                modifiedOptions.autoplay = true;
            }
        }

        videojsPlugin($video.get(0), modifiedOptions, function () {
            var videoPlayer = this;
            var videoElement = videoPlayer.contentEl();
            var $videoElement = $(videoElement);
            var $carouselCmp = $videoElement.closest('[data-cmp="carousel"]');
            $videoElement.isForcedCarouselSlideChange = false;
            var $videoContainer = $videoElement.closest('.js-video-container');

            $videoElement.addClass('js-video-el');

            // pause other videos when this one starts play
            videoPlayer.on('play', function () {
                $videoContainer.addClass('m-video--playing');
                if (modifiedOptions.videoIsInCarousel) {
                    var playingVideoIndex = $videoElement.closest('.slick-slide').data('slick-index');
                    $videoElement.isForcedCarouselSlideChange = true;
                    $carouselCmp[0].slick.goTo(playingVideoIndex);
                }
                // commented below because if there are multiple videos in page, others are getting paused and can't play them
                // for (var playerID in videojsPlugin.players) { // eslint-disable-line
                //     if (playerID !== this.id()) {
                //         videojsPlugin.players[playerID].pause();
                //     }
                // }
            });

            // return player to default state after video ending
            videoPlayer.on('ended', function () {
                videoPlayer.hasStarted(false);
                $videoContainer.removeClass('m-video--playing');
            });

            videoPlayer.on('pause', function () {
                $videoContainer.removeClass('m-video--playing');
            });

            videoPlayer.ready(function () {
                if (modifiedOptions.muted) {
                    videoPlayer.muted(true);
                }

                videoPlayer.on('loadedmetadata', function () {
                    // Mute the audio track, if there is one, so video will autoplay on button click
                    if (modifiedOptions.autoplay) {
                        videoPlayer.play();
                    }
                });
            });

            if (layout.isMobile()) {
                // add specific class for player on mobile devices
                videoPlayer.addClass('vjs-mobile');

                if (helpers.isPlatformIOS()) {
                    videoPlayer.addClass('vjs-mobile-ios');
                }

                // allow user to swipe video as a slide if it's inside slick slider.
                // So all clicks on player should be handled as pause\start to mimic generic player behavior
                $videoElement.addClass('vjs-swipe-enabled').on('click', function () {
                    if (videoPlayer.paused()) {
                        videoPlayer.play();
                    } else {
                        videoPlayer.pause();
                    }
                });
            }

            // Pause any video in carousels slides on slide change
            $videoElement.closest('.slick-slider').on('beforeChange', function () {
                if ($videoElement.isForcedCarouselSlideChange) {
                    // Not stop video if slide was actived by clicking on video Play button
                    $videoElement.isForcedCarouselSlideChange = false;
                    return;
                }

                videoPlayer.pause();
            });

            videoElement.player = videoPlayer;
        });
    },

    /**
     * @function
     * @description Create video
     * @param {object} selector for video element
     * @param {object} params additional options for video
     */
    create: function (selector, params) {
        if (!selector) {
            return;
        }
        var $video = $(selector);
        if ($video.data('id')) {
            if ($video.data('id').indexOf('desktop') === 0 && layout.isMobile()) {
                return;
            }
            if ($video.data('id').indexOf('desktop') !== 0 && !layout.isMobile()) {
                return;
            }
        }
        var $carouselCmp = $video.closest('[data-cmp="carousel"]');
        var videoDataOptions = $video.data('video');
        var videoOptions = $.extend({}, this.options, videoDataOptions, params || {});

        videoOptions.videoIsInCarousel = $carouselCmp.length > 0;

        if (videoOptions.videoIsInCarousel) {
            $carouselCmp.on('init', function () {
                this.initVideoPlugin($video, videoOptions);
            });
            return;
        }

        this.initVideoPlugin($video, videoOptions);
    }
};

module.exports = video;
