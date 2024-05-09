'use strict';

var viewportWidth = {
    mobile: { maxWidth: window.MEDIA_BREAKPOINTS.md - 2, minWidth: 320 },
    tablet: { maxWidth: window.MEDIA_BREAKPOINTS.sm, minWidth: window.MEDIA_BREAKPOINTS.sm - 1 },
    largeTablet: { maxWidth: 1366, minWidth: window.MEDIA_BREAKPOINTS.md - 1 }
};

var layout = {
    viewPorts: viewportWidth,
    isMobile: function() {
        return window.matchMedia('(max-width: ' + (viewportWidth.mobile.maxWidth) + 'px)').matches;
    },
    isTablet: function() {
        return window.matchMedia('(min-width: ' + (viewportWidth.tablet.maxWidth) + 'px)').matches;
    },
    isLargeTablet: function() {
        return window.matchMedia('(min-width: ' + (viewportWidth.largeTablet.maxWidth) + 'px)').matches;
    },
    isDesktop: function() {
        return window.matchMedia('(min-width: ' + (viewportWidth.tablet.maxWidth + 1) + 'px)').matches;
    }
};

module.exports = layout;
