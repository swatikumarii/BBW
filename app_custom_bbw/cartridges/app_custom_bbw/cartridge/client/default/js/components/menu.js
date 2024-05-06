'use strict';

var layout = require('../utils/layout');

/* Responsive menu slide panel */

$('#mobile-slide-search').on('click', function () {
    $('.mobile-slide-menu-search').addClass('active');
    $('.mobile-slide-cancel').css('display', 'block');
});

/* Slide panel cancel button */

$('.mobile-slide-cancel').on('click', function () {
    $('.mobile-slide-menu-search').removeClass('active');
});

/* Responsive menu and its sub-menues */
if (layout.isMobile()) {
    $('.level-1-li').on('click', function () {
        if ($(this).hasClass('active')) {
            $(this).children('.level-2-ul').removeClass('active');
            $('.level-2-li').removeClass('active');
            $('.level-3-ul').removeClass('active');
            $(this).removeClass('active');
        } else {
            $('.level-1-li').removeClass('active');
            $('.level-2-ul').removeClass('active');
            $('.level-2-li').removeClass('active');
            $('.level-3-ul').removeClass('active');
            $(this).addClass('active');
            $(this).children('.level-2-ul').addClass('active');
        }
    });

    $('.level-2-li').on('click', function (e) {
        if ($(this).hasClass('active')) {
            $(this).children('.level-3-ul').removeClass('active');
            $(this).removeClass('active');
        } else {
            $(this).addClass('active');
            $(this).children('.level-3-ul').addClass('active');
        }
        e.stopImmediatePropagation();
    });
}

/* Close slide panel on clicking of menu overlay */

$('.mobile-menu-overlay').on('click', function () {
    $('.bbw-menu').removeClass('in');
});

/* Header my account dropdown */
$('.account-dropdown').on('click', function (e) {
    if ($(this).find('.dropdown-menu').hasClass('show')) {
        $(this).find('.dropdown-menu').removeClass('show');
    } else {
        $(this).find('.dropdown-menu').addClass('show');
    }
    e.stopPropagation();
});

/** Close header account dropdown on body click */
$('body').on('click', function () {
    var accountDropdownMenu = $('.account-dropdown').find('.dropdown-menu');
    if (accountDropdownMenu && accountDropdownMenu.hasClass('show')) {
        accountDropdownMenu.removeClass('show');
    }
});
