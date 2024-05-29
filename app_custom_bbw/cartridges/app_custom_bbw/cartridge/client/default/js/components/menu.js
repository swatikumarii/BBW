'use strict';

var keyboardAccessibility = require('./keyboardAccessibility');
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

/** BBW Brand Header Start */
if (layout.isDesktop() || layout.isTablet()) {
    // Show class on hover
    var $level2li = $('.level-2-li');
    var $level1li = $('.level-1-link');

    $level1li
        .on('mouseenter', function () {
            var $level1Parent = $(this).parent();
            var maxWidth;
            $(this)
                .find('.level-2-li')
                .each(function () {
                    if ($(this).width() > maxWidth) {
                        maxWidth = $(this).width();
                    }
                });
            $(this).find('.level-2-li').width(maxWidth);

            var $ul = $level1Parent
                .find('.level-2-li')
                .first()
                .find('.level-3-ul');
            var totalLiHeight = 0;

            // Calculate the total height of all li elements in the current ul
            $ul.find('li').each(function () {
                totalLiHeight += $(this).height();
            });

            var containerHeight = $(this).parent().find('.level-2-ul').height();
            // Compare total height of li elements with main container height
            if (totalLiHeight > containerHeight) {
                $ul.addClass('two-column');
            }

            $(this)
                .parent()
                .find('.menu-wrap-level-1')
                .hover(
                    function () {
                        $level1Parent.addClass('show');
                        $level1Parent
                            .find('.level-2-li')
                            .first()
                            .addClass('show');
                        $level1Parent
                            .find('.level-2-li .menu-wrap-level-3')
                            .first()
                            .addClass('show');
                    },
                    function () {
                        $('.level-2-li').removeClass('show');
                        $level1Parent.removeClass('show');
                        $('body')
                            .find('.menu-wrap-level-3')
                            .removeClass('show');
                    }
                );
            $('body').find('.menu-wrap-level-3').removeClass('show');
            $level2li.removeClass('show');
            $(this).parent().find('.level-2-li').first().addClass('show');
            $(this)
                .parent()
                .find('.level-2-li')
                .first()
                .find('.menu-wrap-level-3')
                .addClass('show');
            var $level2liWidth = $(this)
                .parent()
                .find('.level-2-li')
                .first()
                .width();
            var $menuWrapLevel3Width = $(this)
                .parent()
                .find('.level-3-ul')
                .width();
            $(this)
                .parent()
                .find('.menu-right')
                .css('left', $level2liWidth + $menuWrapLevel3Width);
            window.menuRightWidth = $level2liWidth + $menuWrapLevel3Width;
        })
        .on('mouseleave', function () {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                $('body').find('.menu-wrap-level-3').removeClass('show');
                $('body').find('.menu-wrap-level-3').removeClass('show');
                $(this)
                    .parent()
                    .find('.level-2-li')
                    .first()
                    .removeClass('show');
                $(this)
                    .parent()
                    .find('.level-2-li')
                    .first()
                    .removeClass('show');
            }, 3000);
        });

    $level2li.hover(function (e) {
        e.preventDefault();
        $('body').find('.menu-wrap-level-3').removeClass('show');
        $level2li.removeClass('show');
        $(this).addClass('show');
        $(this).find('.menu-wrap-level-3').addClass('show');
    });

    $('.explore-li').hover(
        function () {
            var $level2liWidth = $(this).width();
            $('body').find('.menu-wrap-level-3').removeClass('show');
            $level2li.removeClass('show');
            $(this)
                .closest('div.level-2-ul-wrap')
                .find('.menu-right')
                .css('left', $level2liWidth);
        },
        function () {
            $(this)
                .closest('div.level-2-ul-wrap')
                .find('.menu-right')
                .css('left', window.menuRightWidth);
        }
    );

    /** 2 Column layout */
    // Select the main container div

    $level2li.hover(function () {
        var this1 = $(this);
        var $level2liWidth = $(this).width();
        var $menuWrapLevel3Width = $(this).find('.level-3-ul').width();
        $(this)
            .parent()
            .find('.menu-right')
            .css('left', $level2liWidth + $menuWrapLevel3Width);
        window.menuRightWidth = $level2liWidth + $menuWrapLevel3Width;

        var $mainContainer = $(this).parent();

        // Get the height of the main container div
        var containerHeight = $mainContainer.height();

        // Iterate over each ul within the container
        $mainContainer.find('.level-3-ul').each(function () {
            var $ul = $(this);
            var totalLiHeight = 0;

            // Calculate the total height of all li elements in the current ul
            $ul.find('li').each(function () {
                totalLiHeight += $(this).height();
            });

            // Compare total height of li elements with main container height
            if (totalLiHeight > containerHeight) {
                $ul.addClass('two-column');

                $level2liWidth = this1.width();
                $menuWrapLevel3Width = this1.find('.level-3-ul').width();
                this1
                    .parent()
                    .find('.menu-right')
                    .css('left', $level2liWidth + $menuWrapLevel3Width);
                window.menuRightWidth = $level2liWidth + $menuWrapLevel3Width;
            }
        });
    });
}
$('.menu-wrap-level-1').hover(function () {
    clearTimeout(timeoutId);
});

/** BBW Brand Header End */

// var clearSelection = function (element) {
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
                timeoutId = setTimeout(function () {
                    $(self).removeClass('show');
                    $(self).children('.dropdown-menu').removeClass('show');
                    $(self)
                        .children('.nav-link')
                        .attr('aria-expanded', 'false');
                }, 3000); // 2000 milliseconds = 2 seconds
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
