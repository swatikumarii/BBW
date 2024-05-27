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
        if (!$(e.target).closest('.js-search-suggestions').length) {
            $('#header-search').removeClass('expand-towards-right');
            $('.utility-user, .minicart').removeClass('d-lg-none d-md-none');
            $('.search-fly-out-opacity').addClass('d-none');
            e.stopPropagation();
        }
    });
}

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
    if ($('form').hasClass('registration')) {
        $('.loginPopup').find('#loginModal').modal('hide');
        var href = $('#log-in-page-url').attr('href');
        window.location.href = href;
    } else {
        $('.loginPopup').find('#loginModal').modal('show');
    }
}
module.exports = function () {
    $('.loginPopupBtn').on('click', openLoginPopup);
    $('#logoutButton').on('click', function () {
        if (sessionStorage.getItem('profileIncomplete') !== null) {
            sessionStorage.removeItem('profileIncomplete');
        }
    });
};

/** Sticky header padding on body */
$(window).on('scroll resize', function () {
    var $header = $('header.header');
    var $body = $('body');
    if ($body.hasClass('checkout-page') === false) {
        $body.css('padding-top', $header.outerHeight());
    }
    $('header.header').addClass('fixed-header');
});

/* Stick Header - On Scroll */
var selectElement = $('header'); // Select header element
var initialHeight = 0; // Initial height of header
var newTopPosition = 0; // New top position of header
var selectBody = $('body'); // Select body element
var selectWindow = $(window); // Select window element
var currentScroll = 0; // Current scroll position
var previousScroll = 0; // Previous scroll position
var difference = 0; // Difference between previous and current scroll position

// On scroll event
selectWindow.on('scroll', function () {
    if ($('body').hasClass('checkout-page') === false) {
        initialHeight = selectElement.outerHeight(); // Get current height of header
        currentScroll = selectWindow.scrollTop(); // Get current scroll position
        difference = previousScroll - currentScroll; // Calculate difference between previous and current scroll position
        newTopPosition = parseInt(selectElement.css('top'), 10) + difference; // Calculate new top position of header

        // Add padding to body to compensate for fixed header
        selectBody.css('padding-top', initialHeight);

        // Determine header's position based on scroll direction
        if (currentScroll <= 0) {
            selectElement.css('top', 0); // If at the top of the page, set header to top
        } else if (difference > 0) {
            selectElement.css('top', newTopPosition > 0 ? 0 : newTopPosition); // If scrolling up, move header up
        } else if (difference < 0 && newTopPosition > -initialHeight) {
            selectElement.css('top', newTopPosition); // If scrolling down but header is still within viewport, move header down
        }

        previousScroll = currentScroll; // Update previous scroll position
    }
});
