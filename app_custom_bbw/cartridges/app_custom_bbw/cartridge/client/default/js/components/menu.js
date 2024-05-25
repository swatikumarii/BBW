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

    $level1li.hover(
        function () {
            var $level1Parent = $(this).parent();
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
        },
        function () {
            $('body').find('.menu-wrap-level-3').removeClass('show');
            $(this).parent().find('.level-2-li').first().removeClass('show');
        }
    );

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
            // $(this).addClass('show');
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

    // Calculate level 2 ul width
    var level2ul = $('.bbw-brand-menu .level-2-ul').width();
    $('.level-2-li').css('width', level2ul);
}
/** BBW Brand Header End */
