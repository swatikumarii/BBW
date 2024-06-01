'use strict';

var keyboardAccessibility = require('base/components/keyboardAccessibility');
var layout = require('../utils/layout');
var timeoutId;

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
        $('.level-1-li').not(this).addClass('muted');
        if ($(this).hasClass('active')) {
            $(this).children('.level-2-ul').removeClass('active');
            $('.level-2-li, .level-3-ul').removeClass('active');
            $(this).removeClass('active');
            $('.level-1-li.muted').removeClass('muted');
        } else {
            $('.level-1-li, .level-2-ul, .level-2-li, .level-3-ul').removeClass(
                'active'
            );
            $(this).addClass('active');
            $(this).children('.level-2-ul').addClass('active');
        }
    });

    $('.level-2-li').on('click', function (e) {
        if ($(this).hasClass('active') && e.target.role !== 'menuitem') {
            $(this).children('.level-3-ul').removeClass('active');
            $('.category-top-items').removeClass('in');
            $(this).removeClass('active');
            $('.category-top-items .level-3-ul').removeClass('active');
        } else {
            $(this).addClass('active');
            $(this).children('.level-3-ul').addClass('active');
            $('.category-top-items').addClass('in');
            $('.category-top-items .level-3-ul').addClass('active');
        }
        e.stopImmediatePropagation();
    });
}

/* Close slide panel on clicking of menu overlay */

$('.mobile-menu-overlay').on('click', function () {
    $('.bbw-menu, .bbw-brand-menu').removeClass('in');
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
//     $(element)
//         .closest('.dropdown')
//         .children('.dropdown-menu')
//         .children('.top-category')
//         .detach();
//     $(element)
//         .closest('.dropdown.show')
//         .children('.nav-link')
//         .attr('aria-expanded', 'false');
//     $(element)
//         .closest('.dropdown.show')
//         .children('.dropdown-menu')
//         .attr('aria-hidden', 'true');
//     $(element).closest('.dropdown.show').removeClass('show');
//     $('div.menu-group > ul.nav.navbar-nav > li.nav-item > a').attr(
//         'aria-hidden',
//         'false'
//     );
//     $(element).closest('li').detach();
// };

module.exports = function () {
    var isDesktop = function (element) {
        return (
            $(element).parents('.menu-toggleable-left').css('position') !==
            'fixed'
        );
    };

    $('.dropdown:not(.disabled) [data-toggle="dropdown"]')
        .on('mouseenter', function (e) {
            e.preventDefault();
            if (isDesktop(this)) {
                clearTimeout(timeoutId);
                var eventElement = this;
                $('.navbar-nav > li').each(function () {
                    if (!$.contains(this, eventElement)) {
                        if ($(this).hasClass('show')) {
                            $(this).removeClass('show');
                            $(this)
                                .children('ul.dropdown-menu')
                                .removeClass('show');
                            $(this)
                                .children('.nav-link')
                                .attr('aria-expanded', 'false');
                        }
                    }
                });
                // need to close all the dropdowns that are not direct parent of current dropdown
                $(this).parent().addClass('show');
                $(this).siblings('.dropdown-menu').addClass('show');
                $(this).attr('aria-expanded', 'true');
            }
        })
        .parent()
        .on('mouseleave', function (e) {
            e.preventDefault();
            var self = $(this);
            if (isDesktop(this)) {
                $(self).removeClass('show');
                $(self).children('.dropdown-menu').removeClass('show');
                $(self).children('.nav-link').attr('aria-expanded', 'false');
            }
        });

    $('.navbar>.close-menu>.close-button').on('click', function (e) {
        e.preventDefault();
        $('.menu-toggleable-left').removeClass('in');
        $('.modal-background').hide();

        $('.navbar-toggler').focus();

        $('.main-menu').attr('aria-hidden', 'true');
        $('.main-menu').siblings().attr('aria-hidden', 'false');
        $('header').siblings().attr('aria-hidden', 'false');
    });

    $('.navbar-nav').on('click', '.back', function (e) {
        e.preventDefault();
        // clearSelection(this);
    });

    $('.navbar-nav').on('click', '.close-button', function (e) {
        e.preventDefault();
        $('.navbar-nav').find('.top-category').detach();
        $('.navbar-nav').find('.nav-menu').detach();
        $('.navbar-nav').find('.show').removeClass('show');
        $('.menu-toggleable-left').removeClass('in');

        $('.main-menu').siblings().attr('aria-hidden', 'false');
        $('header').siblings().attr('aria-hidden', 'false');

        $('.modal-background').hide();
    });

    $('.navbar-toggler').click(function (e) {
        e.preventDefault();
        $('.main-menu').toggleClass('in');
        $('.modal-background').show();

        $('.main-menu').removeClass('d-none');
        $('.main-menu').attr('aria-hidden', 'false');
        $('.main-menu').siblings().attr('aria-hidden', 'true');
        $('header').siblings().attr('aria-hidden', 'true');

        $('.main-menu .nav.navbar-nav .nav-link').first().focus();
    });

    keyboardAccessibility(
        '.navbar-header .user',
        {
            40: function ($popover) {
                // down
                if ($popover.children('a').first().is(':focus')) {
                    $popover.next().children().first().focus();
                } else {
                    $popover.children('a').first().focus();
                }
            },
            38: function ($popover) {
                // up
                if ($popover.children('a').first().is(':focus')) {
                    $(this).focus();
                    $popover.removeClass('show');
                } else {
                    $popover.children('a').first().focus();
                }
            },
            27: function () {
                // escape
                $('.navbar-header .user .popover').removeClass('show');
                $('.user').attr('aria-expanded', 'false');
            },
            9: function () {
                // tab
                $('.navbar-header .user .popover').removeClass('show');
                $('.user').attr('aria-expanded', 'false');
            }
        },
        function () {
            var $popover = $('.user .popover li.nav-item');
            return $popover;
        }
    );

    $('.navbar-header .user').on('mouseenter focusin', function () {
        if ($('.navbar-header .user .popover').length > 0) {
            $('.navbar-header .user .popover').addClass('show');
            $('.user').attr('aria-expanded', 'true');
        }
    });

    $('.navbar-header .user').on('mouseleave', function () {
        $('.navbar-header .user .popover').removeClass('show');
        $('.user').attr('aria-expanded', 'false');
    });
    $('body').on('click', '#myaccount', function (event) {
        event.preventDefault();
    });
};
