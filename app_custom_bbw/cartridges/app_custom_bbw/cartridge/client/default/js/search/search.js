'use strict';

var helpers = require('../utils/scrollHelpers');
var debounce = require('lodash/debounce');

/**
 * Update DOM elements with Ajax results
 * @param {object} $results - jQuery DOM element
 * @param {string} selector - DOM element to look up in the $results
 * @returns {undefined}
 */
function updateDom($results, selector) {
    var $updates = $results.find(selector);
    $(selector).empty().html($updates.html());
}

/**
 * Keep refinement panes expanded/collapsed after Ajax refresh
 * @param {object} $results - jQuery DOM element
 * @returns {undefined}
 */
function handleRefinements($results) {
    $('.refinement.active').each(function () {
        $(this).removeClass('active');
        var activeDiv = $results.find('.' + $(this)[0].className.replace(/ /g, '.'));
        activeDiv.addClass('active');
        activeDiv.find('button.title').attr('aria-expanded', 'true');
    });

    updateDom($results, '.refinements');
}

/**
 * Parse Ajax results and updated select DOM elements
 * @param {string} response - Ajax response HTML code
 * @returns {undefined}
 */
function parseResults(response) {
    var $results = $(response);
    var specialHandlers = {
        '.refinements': handleRefinements
    };

    // Update DOM elements that do not require special handling
    [
        '.grid-header',
        '.header-bar',
        '.header.page-title',
        '.product-grid-wrapper',
        '.show-more',
        '.filter-bar'
    ].forEach(function (selector) {
        updateDom($results, selector);
    });

    Object.keys(specialHandlers).forEach(function (selector) {
        specialHandlers[selector]($results);
    });
}

/**
 * This function retrieves another page of content to display in the content search grid
 * @param {Element} $element - the jquery element that has the click event attached
 * @param {Element} $target - the jquery element that will receive the response
 * @returns {undefined}
 */
function getContent($element, $target) {
    var showMoreUrl = $element.data('url');
    $.spinner().start();
    $.ajax({
        url: showMoreUrl,
        method: 'GET',
        success: function (response) {
            $target.append(response);
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * Update sort option URLs from Ajax response
 * @param {string} response - Ajax response HTML code
 * @returns {undefined}
 */
function updateSortOptions(response) {
    var $tempDom = $('<div>').append($(response));
    var sortOptions = $tempDom.find('.grid-footer').data('sort-options').options;
    sortOptions.forEach(function (option) {
        $('option.' + option.id).val(option.url);
    });
}

/**
 * Sorts and groups list items alphabetically based on the text content of a specified element.
 * @function searchAlphabetSort
 */
function searchAlphabetSort() {
    $('#fragrance-name .filter-list li').sort(function (a, b) {
        var textA = $(a).find('span[aria-hidden="true"]').text().trim().toUpperCase();
        var textB = $(b).find('span[aria-hidden="true"]').text().trim().toUpperCase();
        return textA.localeCompare(textB);
    }).appendTo('.filter-list');

    // Hide all list items
    $('#fragrance-name .filter-list li').hide();

    // Variable to keep track of the current letter
    var currentLetter = '';

    // Iterate through sorted list items and group by first letter
    $('#fragrance-name .filter-list li').each(function () {
        var text = $(this).find('span[aria-hidden="true"]').text().trim();
        var firstLetter = text[0].toUpperCase();

        // Check if we need to add a new header
        if (firstLetter !== currentLetter) {
            currentLetter = firstLetter;
            $('<li class="header"></li>').text(currentLetter).css('font-weight', 'bold').appendTo('.filter-list');
        }

        // Append the list item
        $(this).appendTo('#fragrance-name .filter-list');
        $(this).show();
    });
}

module.exports = {
    categorySwiper: function () {
        helpers.dragScroll();
    },
    searchAlphabetSort: function () {
        searchAlphabetSort();
    },
    filter: function () {
        // Display refinements bar when Menu icon clicked
        $('.container').on('click', 'button.filter-results', function () {
            $('.refinement-bar, .modal-background').show();
            $('.refinement-bar').siblings().attr('aria-hidden', true);
            $('.refinement-bar').closest('.row').siblings().attr('aria-hidden', true);
            $('.refinement-bar').closest('.tab-pane.active').siblings().attr('aria-hidden', true);
            $('.refinement-bar').closest('.container.search-results').siblings().attr('aria-hidden', true);
            $('.refinement-bar .close').focus();
        });
    },

    closeRefinements: function () {
        // Refinements close button
        $('.container').on('click', '.refinement-bar button.close, .modal-background', function () {
            $('.refinement-bar, .modal-background').hide();
            $('.refinement-bar').siblings().attr('aria-hidden', false);
            $('.refinement-bar').closest('.row').siblings().attr('aria-hidden', false);
            $('.refinement-bar').closest('.tab-pane.active').siblings().attr('aria-hidden', false);
            $('.refinement-bar').closest('.container.search-results').siblings().attr('aria-hidden', false);
            $('.btn.filter-results').focus();
        });
    },

    resize: function () {
        // Close refinement bar and hide modal background if user resizes browser
        $(window).resize(function () {
            $('.refinement-bar, .modal-background').hide();
            $('.refinement-bar').siblings().attr('aria-hidden', false);
            $('.refinement-bar').closest('.row').siblings().attr('aria-hidden', false);
            $('.refinement-bar').closest('.tab-pane.active').siblings().attr('aria-hidden', false);
            $('.refinement-bar').closest('.container.search-results').siblings().attr('aria-hidden', false);
        });
    },

    sort: function () {
        // Handle sort order menu selection
        $('.container').on('change', '[name=sort-order]', function (e) {
            e.preventDefault();

            $.spinner().start();
            $(this).trigger('search:sort', this.value);
            $.ajax({
                url: this.value,
                data: { selectedUrl: this.value },
                method: 'GET',
                success: function (response) {
                    $('.product-grid-wrapper').empty().html(response);
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    showMore: function () {
        // Show more products
        $('.container').on('click', '.show-more button', function (e) {
            e.stopPropagation();
            var showMoreUrl = $(this).data('url');
            e.preventDefault();

            $.spinner().start();
            $(this).trigger('search:showMore', e);
            $.ajax({
                url: showMoreUrl,
                data: { selectedUrl: showMoreUrl },
                method: 'GET',
                success: function (response) {
                    $('.grid-footer').replaceWith(response);
                    updateSortOptions(response);
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    applyFilter: function () {
        // Handle refinement value selection and reset click
        $('.container').on(
            'click',
            '.refinements li button, .filter-bar-desktop__filters li button, .refinement-bar button.reset, .reset-filters ,.filter-value button, .swatch-filter button',
            function (e) {
                e.preventDefault();
                e.stopPropagation();

                $.spinner().start();
                $(this).trigger('search:filter', e);

                var searchUrl = $(this).data('href');
                var seoUrl = $(this).data('seo-href') || searchUrl;
                if (seoUrl) {
                    window.history.pushState({}, null, seoUrl);
                }

                var attributeId = '#' + $(this).find('span').last().attr('id');
                $.ajax({
                    url: searchUrl,
                    data: {
                        page: $('.grid-footer').data('page-number'),
                        selectedUrl: searchUrl
                    },
                    method: 'GET',
                    success: function (response) {
                        parseResults(response);
                        searchAlphabetSort();
                        $.spinner().stop();
                        $(attributeId).parent('button').focus();
                    },
                    error: function () {
                        $.spinner().stop();
                        $(attributeId).parent('button').focus();
                    }
                });
            }
        );
    },

    showContentTab: function () {
        // Display content results from the search
        $('.container').on('click', '.content-search', function () {
            if ($('#content-search-results').html() === '') {
                getContent($(this), $('#content-search-results'));
            }
        });

        // Display the next page of content results from the search
        $('.container').on('click', '.show-more-content button', function () {
            getContent($(this), $('#content-search-results'));
            $('.show-more-content').remove();
        });
    },

    onPopState: function () {
        $(window).on('popstate', function () {
            window.location = window.location.href;
        });
    },

    searchFilter: function () {
        $('#fragrance-name #filterInput').on('keyup', debounce(function () {
            var filter = $(this).val().toUpperCase();
            $('#fragrance-name .filter-list li').each(function () {
                // Skip headers
                if ($(this).hasClass('header')) return;

                var text = $(this).find('span[aria-hidden="true"]').text().toUpperCase();
                if (text.indexOf(filter) > -1) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });

            // Hide headers that have no visible items underneath
            $('#fragrance-name .filter-list li.header').each(function () {
                var header = $(this);
                var nextItems = header.nextUntil('.header');
                var visibleItems = nextItems.filter(':visible');
                header.toggle(visibleItems.length > 0);
            });
        }, 500));
    }
};
