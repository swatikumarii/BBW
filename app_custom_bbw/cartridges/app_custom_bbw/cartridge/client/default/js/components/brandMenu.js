'use strict';

var keyboardAccessibility = require('base/components/keyboardAccessibility');
var layout = require('../utils/layout');
var timeoutId;
var menuTimeOut;
var menuTimeOut2;

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
            // $('.category-top-items').removeClass('in');
            $(this).removeClass('active');
            // $('.category-top-items .level-3-ul').removeClass('active');
        } else {
            $(this).addClass('active');
            $(this).children('.level-3-ul').addClass('active');
            $('.category-top-items').addClass('in');
            $('.category-top-items .level-3-ul').addClass('active');
        }
        e.stopImmediatePropagation();
    });
}

if (layout.isTablet() && !layout.isDesktop() && !layout.isMobile()) {
    $('.level-1-li .level-1-link, .level-2-li .level-2-link')
        .filter(function () {
            // Exclude elements that are children of .level-2-li and have class .explore-li
            return !$(this).closest('.level-2-li').hasClass('explore-li');
        })
        .on('click', function (e) {
            e.preventDefault();
        });

    // Show class on hover
    var $tabletlevel2li = $('.level-2-li');
    var $tabletlevel1li = $('.level-1-link');

    $tabletlevel1li.on('mouseenter', function () {
        clearTimeout(timeoutId);
        var lvl1liElement = this;
        menuTimeOut2 = setTimeout(function () {
            var $level1Parent = $(lvl1liElement).parent();
            $('.level-1-li').not($level1Parent).addClass('muted');
            var maxWidth;
            $(lvl1liElement)
                .find('.level-2-li')
                .each(function () {
                    if ($(lvl1liElement).width() > maxWidth) {
                        maxWidth = $(lvl1liElement).width();
                    }
                });
            $(lvl1liElement).find('.level-2-li').width(maxWidth);

            var $ul = $level1Parent
                .find('.level-2-li')
                .first()
                .find('.level-3-ul');
            var totalLiHeight = 0;

            // Calculate the total height of all li elements in the current ul
            $ul.find('li').each(function () {
                totalLiHeight += $(this).height();
            });

            var containerHeight = $(lvl1liElement)
                .parent()
                .find('.level-2-ul')
                .height();
            // Compare total height of li elements with main container height
            if (totalLiHeight > containerHeight) {
                $ul.addClass('two-column');
            }

            $('body').find('.menu-wrap-level-3').removeClass('show');
            $tabletlevel2li.removeClass('show');
            $(lvl1liElement)
                .parent()
                .find('.level-2-li')
                .first()
                .addClass('show');
            $(lvl1liElement)
                .parent()
                .find('.level-2-li')
                .first()
                .find('.menu-wrap-level-3')
                .addClass('show');
            var $level2liWidth = $(lvl1liElement)
                .parent()
                .find('.level-2-li')
                .first()
                .width();
            var $menuWrapLevel3Width = $(lvl1liElement)
                .parent()
                .find('.level-3-ul')
                .width();
            $(lvl1liElement)
                .parent()
                .find('.menu-right')
                .css('left', $level2liWidth + $menuWrapLevel3Width);
            window.menuRightWidth = $level2liWidth + $menuWrapLevel3Width;
        }, 350);
    });

    $tabletlevel2li.hover(function () {
        // e.preventDefault();
        $('body').find('.menu-wrap-level-3').removeClass('show');
        $tabletlevel2li.removeClass('show');
        $(this).addClass('show');
        $(this).find('.menu-wrap-level-3').addClass('show');
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

    $('.explore-li').hover(
        function () {
            var $level2liWidth = $(this).width();
            $('body').find('.menu-wrap-level-3').removeClass('show');
            $tabletlevel2li.removeClass('show');
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
if (layout.isDesktop()) {
    // Show class on hover
    var $level2li = $('.level-2-li');
    var $level1li = $('.level-1-link');

    $level1li.on('mouseenter', function () {
        clearTimeout(timeoutId);
        var lvl1liElement = this;
        menuTimeOut2 = setTimeout(function () {
            var $level1Parent = $(lvl1liElement).parent();
            $('.level-1-li').not($level1Parent).addClass('muted');
            var maxWidth;
            $(lvl1liElement)
                .find('.level-2-li')
                .each(function () {
                    if ($(lvl1liElement).width() > maxWidth) {
                        maxWidth = $(lvl1liElement).width();
                    }
                });
            $(lvl1liElement).find('.level-2-li').width(maxWidth);

            var $ul = $level1Parent
                .find('.level-2-li')
                .first()
                .find('.level-3-ul');
            var totalLiHeight = 0;

            // Calculate the total height of all li elements in the current ul
            $ul.find('li').each(function () {
                totalLiHeight += $(this).height();
            });

            var containerHeight = $(lvl1liElement)
                .parent()
                .find('.level-2-ul')
                .height();
            // Compare total height of li elements with main container height
            if (totalLiHeight > containerHeight) {
                $ul.addClass('two-column');
            }

            $('body').find('.menu-wrap-level-3').removeClass('show');
            $level2li.removeClass('show');
            $(lvl1liElement)
                .parent()
                .find('.level-2-li')
                .first()
                .addClass('show');
            $(lvl1liElement)
                .parent()
                .find('.level-2-li')
                .first()
                .find('.menu-wrap-level-3')
                .addClass('show');
            var $level2liWidth = $(lvl1liElement)
                .parent()
                .find('.level-2-li')
                .first()
                .width();
            var $menuWrapLevel3Width = $(lvl1liElement)
                .parent()
                .find('.level-3-ul')
                .width();
            $(lvl1liElement)
                .parent()
                .find('.menu-right')
                .css('left', $level2liWidth + $menuWrapLevel3Width);
            window.menuRightWidth = $level2liWidth + $menuWrapLevel3Width;
        }, 350);
    });

    $level2li.hover(function (e) {
        e.preventDefault();
        $('body').find('.menu-wrap-level-3').removeClass('show');
        $level2li.removeClass('show');
        $(this).addClass('show');
        $(this).find('.menu-wrap-level-3').addClass('show');
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
}

$('.menu-wrap-level-1, .menu-right').hover(function () {
    clearTimeout(timeoutId);
});

/** BBW Brand Header End */

module.exports = function () {
    var isDesktop = function (element) {
        return (
            $(element).parents('.menu-toggleable-left').css('position') !==
            'fixed'
        );
    };

    keyboardAccessibility(
        '.main-menu .nav-link, .main-menu .dropdown-link',
        {
            40: function (menuItem) {
                // down
                if (menuItem.hasClass('nav-item')) {
                    // top level
                    $('.navbar-nav .show')
                        .removeClass('show')
                        .children('.dropdown-menu')
                        .removeClass('show');
                    menuItem
                        .addClass('show')
                        .children('.dropdown-menu')
                        .addClass('show');
                    menuItem.find('ul > li > a').first().focus();
                } else {
                    menuItem
                        .removeClass('show')
                        .children('.dropdown-menu')
                        .removeClass('show');
                    if (!(menuItem.next().length > 0)) {
                        // if this is the last menuItem
                        menuItem
                            .parent()
                            .parent()
                            .find('li > a') // set focus to the first menuitem
                            .first()
                            .focus();
                    } else {
                        menuItem.next().children().first().focus();
                    }
                }
            },
            39: function (menuItem) {
                // right
                if (menuItem.hasClass('nav-item')) {
                    // top level
                    menuItem
                        .removeClass('show')
                        .children('.dropdown-menu')
                        .removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                    menuItem.next().children().first().focus();
                } else if (menuItem.hasClass('dropdown')) {
                    menuItem
                        .addClass('show')
                        .children('.dropdown-menu')
                        .addClass('show');
                    $(this).attr('aria-expanded', 'true');
                    menuItem.find('ul > li > a').first().focus();
                }
            },
            38: function (menuItem) {
                // up
                if (menuItem.hasClass('nav-item')) {
                    // top level
                    menuItem
                        .removeClass('show')
                        .children('.dropdown-menu')
                        .removeClass('show');
                } else if (menuItem.prev().length === 0) {
                    // first menuItem
                    menuItem
                        .parent()
                        .parent()
                        .removeClass('show')
                        .children('.nav-link')
                        .attr('aria-expanded', 'false');
                    menuItem
                        .parent()
                        .children()
                        .last()
                        .children() // set the focus to the last menuItem
                        .first()
                        .focus();
                } else {
                    menuItem.prev().children().first().focus();
                }
            },
            37: function (menuItem) {
                // left
                if (menuItem.hasClass('nav-item')) {
                    // top level
                    menuItem
                        .removeClass('show')
                        .children('.dropdown-menu')
                        .removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                    menuItem.prev().children().first().focus();
                } else {
                    menuItem
                        .closest('.show')
                        .removeClass('show')
                        .closest('li.show')
                        .removeClass('show')
                        .children()
                        .first()
                        .focus()
                        .attr('aria-expanded', 'false');
                }
            },
            27: function (menuItem) {
                // escape
                var parentMenu = menuItem.hasClass('show')
                    ? menuItem
                    : menuItem.closest('li.show');
                parentMenu.children('.show').removeClass('show');
                parentMenu
                    .removeClass('show')
                    .children('.nav-link')
                    .attr('aria-expanded', 'false');
                parentMenu.children().first().focus();
            }
        },
        function () {
            return $(this).parent();
        }
    );
    // $('.dropdown:not(.disabled) [data-toggle="dropdown"]')
    //     .on('mouseenter', function (e) {
    //         if (isDesktop(this)) {

    //         }
    //     });

    $('.dropdown:not(.disabled) [data-toggle="dropdown"]')
        .on('click', function (e) {
            if (!isDesktop(this)) {
                $('.modal-background').show();
                // copy parent element into current UL
                var li = $(
                    '<li class="dropdown-item top-category" role="button"></li>'
                );
                var link = $(this)
                    .clone()
                    .removeClass('dropdown-toggle')
                    .removeAttr('data-toggle')
                    .removeAttr('aria-expanded')
                    .attr('aria-haspopup', 'false');
                li.append(link);
                var closeMenu = $('<li class="nav-menu"></li>');
                closeMenu.append($('.close-menu').first().clone());
                $(this)
                    .parent()
                    .children('.dropdown-menu')
                    .prepend(li)
                    .prepend(closeMenu)
                    .attr('aria-hidden', 'false');
                // copy navigation menu into view
                $(this).parent().addClass('show');
                $(this).attr('aria-expanded', 'true');
                $(link).focus();
                $('div.menu-group > ul.nav.navbar-nav > li.nav-item > a').attr(
                    'aria-hidden',
                    'true'
                );
                e.preventDefault();
            }
        })
        .on('mouseenter', function (e) {
            e.preventDefault();
            clearTimeout(timeoutId);
            if (isDesktop(this)) {
                clearTimeout(timeoutId);
                var eventElement = this;
                menuTimeOut = setTimeout(function () {
                    $('.navbar-nav > li').each(function () {
                        if (!$.contains(this, eventElement)) {
                            if ($(this).hasClass('show')) {
                                // $('.level-1-li.muted').removeClass('muted');
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
                    $(eventElement).parent().addClass('show');
                    $(eventElement).siblings('.dropdown-menu').addClass('show');
                    $(eventElement).attr('aria-expanded', 'true');
                }, 350);
            }
        })
        .parent()
        .on('mouseleave', function (e) {
            e.preventDefault();
            clearTimeout(menuTimeOut);
            clearTimeout(menuTimeOut2);
            var self = $(this);
            if (isDesktop(this) && self.hasClass('level-1-li')) {
                timeoutId = setTimeout(function () {
                    $('.level-2-li').removeClass('show');
                    $('.menu-wrap-level-3').removeClass('show');
                    $('.level-1-li.muted').removeClass('muted');
                    $('.navbar-nav > li.show').each(function () {
                        if ($(this).hasClass('show')) {
                            $(this).removeClass('show');
                            $(this)
                                .children('.dropdown-menu')
                                .removeClass('show');
                            $(this)
                                .children('.nav-link')
                                .attr('aria-expanded', 'false');
                        }
                    });
                }, 600);
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
