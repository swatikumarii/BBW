'use strict';

var debounce = require('lodash/debounce');
var endpoint = $('.suggestions-wrapper').data('url');
var UP_KEY = 38;
var DOWN_KEY = 40;
var DIRECTION_DOWN = 1;
var DIRECTION_UP = -1;
var windowWidth = $(window).outerWidth();
var lazyload = require('../utils/lazyLoad');
var layout = require('../utils/layout');
var helpers = require('../utils/helpers');

/**
 * Retrieves Suggestions element relative to scope
 * @param {object} scope - Search input field DOM element
 * @returns {object} - (JQuery).suggestions-wrapper element
 */
function getSuggestionsWrapper(scope) {
    return $(scope).find('.suggestions-wrapper');
}

/**
 * Determines whether DOM element is inside the .search-mobile class
 * @param {object} scope - DOM element, usually the input.search-field element
 * @returns {boolean} - Whether DOM element is inside  div.search-mobile
 */
function isMobileSearch(scope) {
    return !!$(scope).closest('.search-mobile').length;
}

/**
 * Remove modal classes needed for mobile suggestions
 *
 */
function clearModals() {
    $('body').removeClass('modal-open');
    $('header').siblings().attr('aria-hidden', 'false');
    $('.suggestions').removeClass('active modal');
}

/**
 * Apply modal classes needed for mobile suggestions
 * @param {object} scope - Search input field DOM element
 */
function applyModals(scope) {
    if (isMobileSearch(scope)) {
        $('body').addClass('modal-open');
        $('header').siblings().attr('aria-hidden', 'true');
        getSuggestionsWrapper(scope).find('.suggestions').addClass('modal');
    }
}

/**
 * Tear down Suggestions panel
 */
function tearDownSuggestions() {
    $('input.search-field').val('');
    clearModals();
    $('.search-mobile .suggestions').unbind('scroll');
    $('.suggestions').empty().removeAttr('style');
    $('.site-search').hide();
}

/**
 * Toggle search field icon from search to close and vice-versa
 * @param {string} action - Action to toggle to
 */
function toggleSuggestionsIcon(action) {
    var mobileSearchIcon = '.search-mobile button.';
    var iconSearch = 'fa-search';
    var iconSearchClose = 'fa-close';

    if (action === 'close') {
        $(mobileSearchIcon + iconSearch).removeClass(iconSearch).addClass(iconSearchClose).attr('type', 'button');
    } else {
        $(mobileSearchIcon + iconSearchClose).removeClass(iconSearchClose).addClass(iconSearch).attr('type', 'submit');
    }
}

/**
 * Determines whether the "More Content Below" icon should be displayed
 * @param {object} scope - DOM element, usually the input.search-field element
 */
function handleMoreContentBelowIcon(scope) {
    if (($(scope).scrollTop() + $(scope).innerHeight()) >= $(scope)[0].scrollHeight) {
        $('.more-below').fadeOut();
    } else {
        $('.more-below').fadeIn();
    }
}

/**
 * Positions Suggestions panel on page
 * @param {object} scope - DOM element, usually the input.search-field element
 */
function positionSuggestions(scope) {
    var outerHeight;
    var $scope;
    var $suggestions;
    var top;

    if (isMobileSearch(scope)) {
        $scope = $(scope);
        top = $scope.offset().top;
        outerHeight = $scope.outerHeight();
        $suggestions = getSuggestionsWrapper(scope).find('.suggestions');
        $suggestions.css('top', top + outerHeight);

        handleMoreContentBelowIcon(scope);

        // Unfortunately, we have to bind this dynamically, as the live scroll event was not
        // properly detecting dynamic suggestions element's scroll event
        $suggestions.scroll(function () {
            handleMoreContentBelowIcon(this);
        });
    }
}

/**
 * Process Ajax response for SearchServices-GetSuggestions
 * @param {object | string} response - Empty object literal if null response or string with rendered
 * suggestions template contents
 */
function processResponse(response) {
    if (typeof (response) !== 'object') {
        var $suggestionsWrapper = getSuggestionsWrapper('.search-suggestions');
        $('.search-suggestions').find('.suggestions').empty().append(response);
        if (layout.isDesktop() || layout.isTablet()) {
            $suggestionsWrapper.parent().stop().slideDown();

            //  Apply Max Height to Product Part
            var productPart;
            productPart = $('.suggestions__results .pdp-link');
            var productPartMaxHeight = helpers.getMaxElementHeight(productPart);
            productPart.css('height', productPartMaxHeight);

        } else {
            $suggestionsWrapper.show();
            if (!$suggestionsWrapper.find('.suggestions').hasClass('active')) {
                $suggestionsWrapper.find('.suggestions').offset({ top: $('#header-search').outerHeight()}).addClass('active modal').slideDown();
            }
        }

        positionSuggestions(this);

        if (isMobileSearch(this)) {
            toggleSuggestionsIcon('close');
            applyModals(this);
        }

        // Trigger screen reader by setting aria-describedby with the new suggestion message.
        var suggestionsList = $('.suggestions .item');
        if ($(suggestionsList).length) {
            $('input.search-field').attr('aria-describedby', 'search-result-count');
        } else {
            $('input.search-field').removeAttr('aria-describedby');
        }
        lazyload.lazyLoad();
    } else {
        $('.search-suggestions').find('.suggestions').empty().hide();
    }
}

/**
 * Retrieve suggestions
 * @param {object} scope - Search field DOM element
 */
function getSuggestions(scope) {
    $('.js-search-suggestions .suggestions__results').spinner().start();
    $.ajax({
        context: scope,
        url: endpoint + encodeURIComponent($(scope).val()),
        method: 'GET',
        success: processResponse,
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * Handle Search Suggestion Keyboard Arrow Keys
 * @param {number} direction takes positive or negative number constant, DIRECTION_UP (-1) or DIRECTION_DOWN (+1)
 */
function handleArrow(direction) {
    // get all li elements in the suggestions list
    var suggestionsList = $('.suggestions .item');
    if (suggestionsList.filter('.selected').length === 0) {
        suggestionsList.first().addClass('selected');
        $('input.search-field').each(function () {
            $(this).attr('aria-activedescendant', suggestionsList.first()[0].id);
        });
    } else {
        suggestionsList.each(function (index) {
            var idx = index + direction;
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
                $(this).removeAttr('aria-selected');
                if (suggestionsList.eq(idx).length !== 0) {
                    suggestionsList.eq(idx).addClass('selected');
                    suggestionsList.eq(idx).attr('aria-selected', true);
                    $(this).removeProp('aria-selected');
                    $('input.search-field').each(function () {
                        $(this).attr('aria-activedescendant', suggestionsList.eq(idx)[0].id);
                    });
                } else {
                    suggestionsList.first().addClass('selected');
                    suggestionsList.first().attr('aria-selected', true);
                    $('input.search-field').each(function () {
                        $(this).attr('aria-activedescendant', suggestionsList.first()[0].id);
                    });
                }
                return false;
            }
            return true;
        });
    }
}

/**
 * Resizes the search suggestion wrapper and centers it on wider screens.
 */
function resizeSuggestionWrapper() {
    if ($('#search-suggestion-wrapper-style').length === 0) {
        var $suggestionWrapper = $('.js-search-suggestions');
        var wrapperWidth = $suggestionWrapper.outerWidth();

        if (windowWidth > 1400 && windowWidth > wrapperWidth) {
            var newWidth = windowWidth + 'px';
            var leftPosition = (windowWidth - wrapperWidth) / 2 * -1;

            $suggestionWrapper.css({
                width: newWidth,
                left: leftPosition + 'px'
            });

            var styles = '.site-search .search-suggestions { width : ' + newWidth + ' !important; left : '+ leftPosition + 'px !important; }';
            var headElement = document.head || document.getElementsByTagName('head')[0];
            var styleElement = document.createElement('style');

            headElement.appendChild(styleElement);
            styleElement.type = 'text/css';
            styleElement.id = 'search-suggestion-wrapper-style';

            if (styleElement.styleSheet) {
                styleElement.styleSheet.cssText = styles;
            } else {
                styleElement.appendChild(document.createTextNode(styles));
            }
        }
    }
}


module.exports = function () {
    $('form[name="simpleSearch"]').submit(function (e) {
        var suggestionsList = $('.suggestions .item');
        if (suggestionsList.filter('.selected').length !== 0) {
            e.preventDefault();
            suggestionsList.filter('.selected').find('a')[0].click();
        }
    });

    $('input.search-field').each(function () {
        var debounceSuggestions = debounce(getSuggestions, 300);
        var suggestionsProcessing = false;
        resizeSuggestionWrapper();

        /**
         * Handle Search Suggestion Keyboard Arrow Keys
         * @param {element} element element
         */
        function handleInputFocus(element) {
            debounceSuggestions(element);  // Run debounceSuggestions when input field is focused
            lazyload.lazyLoad();
        }

        // Attach focus event handler
        $(this).on('focus', function () {
            var phraseLength = $(this).val().length;
            if (phraseLength > 0) {
                $('.js-reset-button').show();
            }
        }).on('blur', function () {
            suggestionsProcessing = false;  // Reset flag on blur
            var phraseLength = $(this).val().length;
            if (!phraseLength > 0) {
                $('.js-reset-button').hide();
            }
        }).on('keyup', function (e) {
            // Capture Down/Up Arrow Key Events
            var phraseLength = $(this).val().length;
            if (phraseLength > 0) {
                $('.js-reset-button').show();
            } else {
                $('.js-reset-button').hide();
            }
            switch (e.which) {
                case DOWN_KEY:
                    handleArrow(DIRECTION_DOWN);
                    e.preventDefault();  // prevent moving the cursor
                    break;
                case UP_KEY:
                    handleArrow(DIRECTION_UP);
                    e.preventDefault();  // prevent moving the cursor
                    break;
                default:
                    // Always allow debounceSuggestions on keyup, regardless of focus status
                    debounceSuggestions(this, e);
            }
        }).on('click', function name() {
            $('.search-fly-out-opacity').removeClass('d-none');
            if (!suggestionsProcessing) {
                suggestionsProcessing = true;  // Set flag to true to indicate processing is active
                handleInputFocus(this);
            }
        });
    });

    $(document.body).on('click', '.js-mobile-custom-search', function () {
        if (layout.isMobile()) {
            $('.site-search').show();
            $('input.search-field').focus().trigger('click');
        }
    });

    $(document.body).on('click', function (e) {
        if (!$(e.target).closest('.js-search-suggestions').length || !$(e.target).closest('.search-field') || !$(e.target).closest('.js-reset-button')) {
            if (layout.isDesktop() || layout.isTablet()) {
                $('.js-search-suggestions').stop().slideUp();
            }
            $('.js-reset-button').hide();
        }
    });

    $(document.body).on('click', '.js-search-suggestions .add-to-cart', function () {
        $('#header-search').removeClass('expand-towards-right');
        $('.utility-user, .minicart').removeClass('d-lg-none d-md-none');
    });

    $('.js-cancel-search-button').on('click touchend', function (e) {
        e.preventDefault();
        toggleSuggestionsIcon('search');
        tearDownSuggestions();
        $('.search-fly-out-opacity').addClass('d-none');
    });

    $('.js-reset-button').on('click', function () {
        $(this).hide();
        $('.js-search-field').val('');
        $('.js-search-field').focus();
        var debounceSuggestions = debounce(getSuggestions, 300);
        debounceSuggestions(this, $('input.search-field'));
    });
};
