'use strict';

var layout = require('../utils/layout');

/* Desktop & Ipad */
if (layout.isDesktop() || layout.isTablet()) {
    $('#header-search').on('click', function (e) {
        $('form').addClass('expand-towards-right');
        $('.utility-user, .minicart').addClass('d-lg-none d-md-none');
        e.stopPropagation();
    });

    $(document).on('click', 'body', function (e) {
        $('#header-search').removeClass(
            'expand-towards-right',
            'all 0.3s ease'
        );
        $('.utility-user, .minicart').removeClass('d-lg-none d-md-none');
        $('.search-fly-out-opacity').addClass('d-none');
        e.stopPropagation();
    });
}

/* Search overlay */
$('.search-field').on('click', function () {
    $('.search-fly-out-opacity').removeClass('d-none');
});

/* Mobile custom search */
$('#mobile-custom-search').on('click', function (e) {
    $('.custom-search').removeClass('d-none');
    $('.search-fly-out-opacity').removeClass('d-none');
    e.preventDefault();
});

/* Search flyout in mobile */
$('.search-fly-out-opacity').on('click', function () {
    $(this).addClass('d-none');
    $('.custom-search').addClass('d-none');
});

/* Header Ticker Function */
$('#ticker').easyTicker({
    visible: 1,
    interval: 3000
});


/**
 * To upen login popup
 */
function openLoginPopup() {
    $('.loginPopup').find('#loginModal').modal('show');
}
module.exports = function () {
    $('#loginPopupBtn').on('click', openLoginPopup);
};

/** Sticky header padding on body */
$(window).on('load resize', function () {
    var $header = $('.header');
    var $body = $('body');

    $body.css('padding-top', $header.outerHeight());
});

/* Stick Header - On Scroll */
var t = $('header'); // Select header element
var i = 0; // Initial height of header
var n = 0; // New top position of header
var r = $('body'); // Select body element
var l = $(window); // Select window element
var c = 0; // Current scroll position
var m = 0; // Previous scroll position
var v = 0; // Difference between previous and current scroll position

// On scroll event
l.on('scroll', function () {
    i = t.outerHeight(); // Get current height of header
    c = l.scrollTop(); // Get current scroll position
    v = m - c; // Calculate difference between previous and current scroll position
    n = parseInt(t.css('top'), 10) + v; // Calculate new top position of header

    // Add padding to body to compensate for fixed header
    r.css('padding-top', i);

    // Determine header's position based on scroll direction
    if (c <= 0) {
        t.css('top', 0); // If at the top of the page, set header to top
    } else if (v > 0) {
        t.css('top', n > 0 ? 0 : n); // If scrolling up, move header up
    } else if (v < 0 && n > -i) {
        t.css('top', n); // If scrolling down but header is still within viewport, move header down
    }

    m = c; // Update previous scroll position
});
