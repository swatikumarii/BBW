'use strict';

var layout = require('../utils/layout');

/* Desktop & Ipad */
if (layout.isDesktop()) {
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

/* Stick Header - On Scroll */
var t = 0;
$(window).scroll(function () {
    var e = $(this).scrollTop();
    if (t < e) {
        $('.header').removeClass('fixed-header');
    } else {
        $('.header').addClass('fixed-header');
    }
    if (e === 0) {
        $('.header').removeClass('fixed-header');
    }
    t = e;
});

/**
 * To upen login popup
 */
function openLoginPopup() {
    $('.loginPopup').find('#loginModal').modal('show');
}
module.exports = function () {
    $('.loginPopupBtn').on('click', openLoginPopup);
};
