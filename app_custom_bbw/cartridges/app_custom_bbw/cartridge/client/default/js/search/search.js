'use strict';

var helpers = require('../utils/scrollHelpers');
var lazyload = require('../utils/lazyLoad');
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
        var activeDiv = $results.find(
            '.' + $(this)[0].className.replace(/ /g, '.')
        );
        activeDiv.addClass('active');
        activeDiv.find('button.title').attr('aria-expanded', 'true');
    });

    updateDom($results, '.refinements');
}

/**
 * update desktop refinement in a way so that open refinement should not close
 * @param {object} $results - jQuery DOM element
 */
function updateRefinements($results) {
    $results.find('.filter-bar-desktop .filter-type').each(function () {
        var id = $(this).attr('id');
        var filter = $('.filter-bar-desktop .filter-type#' + id);
        if (filter.find('.ref-toggle[aria-expanded="true"]').length > 0) {
            $(this).find('.filter-list-wrapper').addClass('show');
            $(this).find('.ref-toggle').attr('aria-expanded', 'true');
        }
    });
}

/**
 * Adjusts the height of elements to match the tallest element in the collection.
 * @returns {jQuery} The jQuery collection after adjusting the height.
 */
$.fn.syncHeight = function () {
    var elements = $.makeArray(this);

    // Sort elements by height
    elements.sort(function (a, b) {
        return $(a).height() - $(b).height();
    });

    // Set height of all elements to the height of the tallest element
    return this.height($(elements[elements.length - 1]).height());
};

/**
 * Adjusts the layout of a product grid based on the viewport width.
 * @param {jQuery} elements - The jQuery collection of product grid elements.
 */
function adjustProductGrid(elements) {
    /**
     * @type {jQuery} filteredElements - Filtered elements based on viewport width.
     */
    var filteredElements = window.matchMedia('(max-width: 479px)').matches
        ? elements.filter(':not(.grid-slot)')
        : elements;

    /**
     * @type {number} itemsPerRow - Number of items per row in the product grid.
     */
    var itemsPerRow = window.matchMedia('(max-width: 1024px)').matches // eslint-disable-line
        ? window.matchMedia('(max-width: 479px)').matches // eslint-disable-line
            ? 2 // eslint-disable-line
            : 3 // eslint-disable-line
        : 4; // eslint-disable-line

    /**
     * @type {number} totalItems - Total number of items in the product grid.
     */
    var totalItems = filteredElements.length;

    if (totalItems > 1) {
        /**
         * @type {number} startIndex - Start index of each iteration.
         */
        var startIndex = 0;

        /**
         * @type {number} endIndex - End index of each iteration.
         */
        var endIndex = itemsPerRow;

        for (var i = 0; totalItems >= i; i += itemsPerRow) {
            /**
             * @type {jQuery} slicedElements - Elements sliced for the current iteration.
             */
            var slicedElements = filteredElements.slice(startIndex, endIndex);

            // Reset inline styles
            slicedElements.removeAttr('style');
            slicedElements.find('.b-product-tile__name').removeAttr('style');
            slicedElements.find('.js-promo-wrapper').removeAttr('style');
            slicedElements.find('.js-product-tile-badge').removeAttr('style');
            slicedElements.find('.pdp-link').removeAttr('style');
            slicedElements.find('.price').removeAttr('style');

            // Sync heights of various elements
            slicedElements.find('.b-product-tile__name').syncHeight();
            slicedElements.find('.js-promo-wrapper').syncHeight();
            slicedElements.find('.js-product-tile-badge').syncHeight();
            slicedElements.find('.pdp-link').syncHeight();
            slicedElements.find('.price').syncHeight();
            // slicedElements.syncHeight();

            // Update start and end index for the next iteration
            startIndex = endIndex;
            endIndex =
                endIndex + itemsPerRow > totalItems
                    ? totalItems
                    : endIndex + itemsPerRow;
        }
    }
}

/**
 * Scrolls elements with the specified selector into view.
 * @param {string} selector - The CSS selector of the elements to scroll into view.
 */
function scrollIntoView(selector) {
    var elements = document.querySelectorAll(selector);

    // Loop through each element
    for (var i = 0; i < elements.length; i++) {
        /**
         * @type {HTMLElement} element - Current element
         */
        var element = elements[i];
        // Calculate offset
        var elementOffset = element.offsetLeft;
        // Get computed styles
        var computedStyles = window.getComputedStyle(element);
        // Parse margin
        var marginLeft = parseInt(computedStyles.marginLeft, 10);
        // Set parent scroll position
        element.parentElement.scrollLeft = elementOffset - marginLeft - 1;
    }
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

    updateRefinements($results);

    // Update DOM elements that do not require special handling
    [
        '.grid-header',
        '.header-bar',
        '.header.page-title',
        '.product-grid-wrapper',
        '.show-more',
        '.selected-filter-mobile'
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
    var sortOptions = $tempDom
        .find('.grid-footer')
        .data('sort-options').options;
    sortOptions.forEach(function (option) {
        $('option.' + option.id).val(option.url);
    });
}

/**
 * Sorts and groups list items alphabetically based on the text content of a specified element.
 * @function searchAlphabetSort
 */
function searchAlphabetSort() {
    // Sort list items alphabetically
    var sortedItems = $('.fragrance-name .filter-list li').sort(
        function (a, b) {
            var textA = $(a)
                .find('span[aria-hidden="true"]')
                .text()
                .trim()
                .toUpperCase();
            var textB = $(b)
                .find('span[aria-hidden="true"]')
                .text()
                .trim()
                .toUpperCase();
            return textA.localeCompare(textB);
        }
    );

    // Create an object to store unique text values
    var uniqueItems = {};

    // Filter out duplicate items and store them in uniqueItems
    sortedItems.each(function () {
        var text = $(this).find('span[aria-hidden="true"]').text().trim();
        uniqueItems[text] = this;
    });

    // Clear the sorted items
    $('.fragrance-name .filter-list').empty();

    // Append the unique sorted items to the filter list and show them
    $.each(uniqueItems, function (index, item) {
        $('.fragrance-name .filter-list').append(item);
    });

    // Variable to keep track of the current letter
    var currentLetter = '';

    // Iterate through sorted list items and group by first letter
    $('.fragrance-name .filter-list li').each(function () {
        var text = $(this).find('span[aria-hidden="true"]').text().trim();
        var firstLetter = text[0].toUpperCase();

        // Check if we need to add a new header
        if (firstLetter !== currentLetter) {
            currentLetter = firstLetter;
            $(
                '<li class="fragrance-filter-header h-bg--gray-1 h-pl--25 h-fw--bold"></li>'
            )
                .text(currentLetter)
                .css('font-weight', 'bold')
                .insertBefore(this);
        }
    });
}

/**
 * Checks the current active item in a carousel slider and adjusts control visibility accordingly.
 * @param {jQuery|string|Element} slider - The jQuery object, selector, or DOM element of the slider.
 */
function checkitem(slider) {
    if (
        $(slider)
            .find('.carousel-inner .carousel-item:first')
            .hasClass('active')
    ) {
        // But show right arrow
        $(slider).find('.carousel-control-next').show();
        // Hide left arrow
        $(slider).find('.carousel-control-prev').hide();
    } else if (
        $(slider).find('.carousel-inner .carousel-item:last').hasClass('active')
    ) {
        // Hide right arrow
        $(slider).find('.carousel-control-prev').show();
        // But show left arrow
        $(slider).find('.carousel-control-next').hide();
    } else {
        $(slider).find('.slider-control').show();
    }
}


/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 * @returns {object} - Object with properties body and footer.
 */
function parseBonusHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.choice-of-bonus-product');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * Retrieves url to use when adding a product to the cart
 * @param {object} data - data object used to fill in dynamic portions of the html
 */
function chooseBonusProducts(data) {
    $('.modal-body').spinner().start();

    if ($('#chooseBonusProductModal').length !== 0) {
        $('#chooseBonusProductModal').remove();
    }
    var bonusUrl;
    if (data.bonusChoiceRuleBased) {
        bonusUrl = data.showProductsUrlRuleBased;
    } else {
        bonusUrl = data.showProductsUrlListBased;
    }

    var htmlString =
        '<!-- Modal -->' +
        '<div class="modal fade" id="chooseBonusProductModal" tabindex="-1" role="dialog">' +
        '<span class="enter-message sr-only" ></span>' +
        '<div class="modal-dialog choose-bonus-product-dialog" ' +
        'data-total-qty="' +
        data.maxBonusItems +
        '"' +
        'data-UUID="' +
        data.uuid +
        '"' +
        'data-pliUUID="' +
        data.pliUUID +
        '"' +
        'data-addToCartUrl="' +
        data.addToCartUrl +
        '"' +
        'data-pageStart="0"' +
        'data-pageSize="' +
        data.pageSize +
        '"' +
        'data-moreURL="' +
        data.showProductsUrlRuleBased +
        '"' +
        'data-bonusChoiceRuleBased="' +
        data.bonusChoiceRuleBased +
        '">' +
        '<!-- Modal content-->' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '    <span class="">' +
        data.labels.selectprods +
        data.labels.selectedprods +
        '</span>' +
        '    <button type="button" class="close pull-right" data-dismiss="modal">' +
        '        <span aria-hidden="true">&times;</span>' +
        '        <span class="sr-only"> </span>' +
        '    </button>' +
        '</div>' +
        '<div class="modal-body"></div>' +
        '<div class="modal-footer"></div>' +
        '</div>' +
        '</div>' +
        '</div>';
    $('body').append(htmlString);
    $('.modal-body').spinner().start();

    $.ajax({
        url: bonusUrl,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.initialAddBonusProduct) {
                $.ajax({
                    type: 'POST',
                    url: response.initialAddBonusProductUrl,
                    async: false
                });
            }
            var parsedHtml = parseBonusHtml(response.renderedTemplate);
            $('#chooseBonusProductModal .modal-body').empty();
            $('#chooseBonusProductModal .enter-message').text(
                response.enterDialogMessage
            );
            $('#chooseBonusProductModal .modal-header .close .sr-only').text(
                response.closeButtonText
            );
            var modalBodybody = '<div class="modal-body-wrap"></div>';
            $('#chooseBonusProductModal .modal-body').html(modalBodybody);
            $('#chooseBonusProductModal .modal-body-wrap').html(parsedHtml.body);
            $('#chooseBonusProductModal .modal-footer').html(parsedHtml.footer);
            $('#chooseBonusProductModal').modal('show');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

module.exports = {
    categorySwiper: function () {
        helpers.dragScroll();
        scrollIntoView('.js-category-swiper.active');
    },

    equalHeight: function () {
        adjustProductGrid($('.product-grid-item'));
    },

    searchAlphabetSort: function () {
        searchAlphabetSort();
    },

    filter: function () {
        // Display refinements bar when Menu icon clicked
        $('.container').on('click', 'button.filter-results', function () {
            helpers.disableScroll();
            $('.refinement-bar, .modal-background').addClass('active');
            $('.refinement-bar').siblings().attr('aria-hidden', true);
            $('.refinement-bar')
                .closest('.row')
                .siblings()
                .attr('aria-hidden', true);
            $('.refinement-bar')
                .closest('.tab-pane.active')
                .siblings()
                .attr('aria-hidden', true);
            $('.refinement-bar')
                .closest('.container.search-results')
                .siblings()
                .attr('aria-hidden', true);
            $('.refinement-bar .close').focus();
        });
    },

    closeFilter: function () {
        $('body').on('click', function (e) {
            // Check if the clicked element is not inside the collapse area and the collapse is open
            if (
                !$(e.target).closest('.js-desktop-filters .collapse').length &&
                $('.js-desktop-filters .collapse').hasClass('show') &&
                !$(e.target).hasClass('ref-toggle')
            ) {
                // Close all open collapses
                $('.js-desktop-filters .collapse.show').collapse('hide');
            }
        });
    },

    closeRefinements: function () {
        // Refinements close button
        $('.container').on(
            'click',
            '.refinement-bar button.close, .modal-background',
            function () {
                $('.refinement-bar, .modal-background').removeClass('active');
                $('.refinement-bar').siblings().attr('aria-hidden', false);
                $('.refinement-bar')
                    .closest('.row')
                    .siblings()
                    .attr('aria-hidden', false);
                $('.refinement-bar')
                    .closest('.tab-pane.active')
                    .siblings()
                    .attr('aria-hidden', false);
                $('.refinement-bar')
                    .closest('.container.search-results')
                    .siblings()
                    .attr('aria-hidden', false);
                $('.btn.filter-results').focus();
                helpers.enableScroll();
            }
        );
    },

    resize: function () {
        // Close refinement bar and hide modal background if user resizes browser
        // $(window).resize(function () {
        //     console.log('resize triggred');
        //     $('.refinement-bar, .modal-background').hide();
        //     $('.refinement-bar').siblings().attr('aria-hidden', false);
        //     $('.refinement-bar').closest('.row').siblings().attr('aria-hidden', false);
        //     $('.refinement-bar').closest('.tab-pane.active').siblings().attr('aria-hidden', false);
        //     $('.refinement-bar').closest('.container.search-results').siblings().attr('aria-hidden', false);
        // });
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
                    lazyload.lazyLoad();
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
                    lazyload.lazyLoad();
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
                        lazyload.lazyLoad();
                        $(attributeId).parent('button').focus();
                    },
                    error: function () {
                        $.spinner().stop();
                        $(attributeId).parent('button').focus();
                    }
                });
                if (
                    $(this).hasClass('reset-filters') &&
                    $('.js-desktop-filters .collapse').hasClass('show')
                ) {
                    $('.js-desktop-filters .collapse.show').collapse('hide');
                }
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
        $(document).on(
            'keyup',
            '.fragrance-name .js-frag-search',
            debounce(function () {
                var filter = $(this).val().toUpperCase();
                $('.fragrance-name .filter-list li').each(function () {
                    // Skip headers
                    if ($(this).hasClass('fragrance-filter-header')) return;

                    var text = $(this)
                        .find('span[aria-hidden="true"]')
                        .text()
                        .toUpperCase();
                    if (text.indexOf(filter) > -1) {
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                });

                // Hide headers that have no visible items underneath
                $(
                    '.fragrance-name .filter-list li.fragrance-filter-header'
                ).each(function () {
                    var header = $(this);
                    var nextItems = header.nextUntil(
                        '.fragrance-filter-header'
                    );
                    var visibleItems = nextItems.filter(':visible');
                    header.toggle(visibleItems.length > 0);
                });
            }, 500)
        );
    },

    hideCarouselArrow: function () {
        $('.b-product-tile__carousel').each(function () {
            var sliderId = '#' + $(this).attr('id');
            $(sliderId).on('slid.bs.carousel', function () {
                checkitem(sliderId);
            });
            checkitem(sliderId);
        });
        $('.b-product-tile__carousel').carousel({
            wrap: false
        });
    },

    handleOutSideClick: function () {
        $(document).on(
            'mouseleave',
            '.js-product-tile',
            debounce(function () {
                if ($(this).find('.js-product-carousel').length > 0) {
                    var sliderId =
                        '#' + $(this).find('.js-product-carousel').attr('id');
                    $(sliderId).carousel(0);
                }
            }, 500)
        );
    },

    searchIngredient: function () {
        $('#search-ingredient li.level-2').on('click', function () {
            $.spinner().start();
            var searchUrl = $(this).find('a').data('href');
            var seoUrl = $(this).find('a').data('seo-href') || searchUrl;
            if (seoUrl) {
                window.history.pushState({}, null, seoUrl);
            }
            var liText = $(this).text();
            $('#ingredient-search').val(liText.trim());

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
                    $('#search-ingredient-div').addClass('d-none');
                    $.spinner().stop();
                    lazyload.lazyLoad();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });

        $('#ingredient-search').on('keyup', function () {
            if ($(this).val().length > 0) {
                $('#search-ingredient-div').removeClass('d-none');
            } else {
                $('#search-ingredient-div').addClass('d-none');
            }
        });

        /**
         * Searches for an ingredient when the Enter key is pressed or the search icon is clicked.
         * @param {string} event - An event
         */
        function searchIngredient(event) {
            var inputValue = event.val();
            var inputField = $('#ingredient-search');
            var firstVisibleLi = $('#search-ingredient ul li')
                .filter((_, li) => $(li).css('display') !== 'none')
                .first();

            if (firstVisibleLi.length) {
                if (inputValue.length !== 0) {
                    var ingredientName = firstVisibleLi.find('a').text();
                    inputValue = ingredientName;
                    inputField.val(ingredientName);
                }

                // var inputValue = $(this).val();
                $.spinner().start();
                var seoHref = event.data('seo-href');
                var href = event.data('href');
                var updatedSEOHref = seoHref + '&prefv1=' + inputValue;
                var updatedHref = href + ('prefv1', inputValue);
                var searchUrl = $('#shopByIngredientUrl').data('href');
                var seoUrl = $('#shopByIngredientUrl').data('seo-href');

                if (inputValue.length !== 0) {
                    searchUrl = updatedHref;
                    seoUrl = updatedSEOHref || searchUrl;
                }

                if (seoUrl) {
                    window.history.pushState({}, null, seoUrl);
                }

                $.ajax({
                    url: searchUrl,
                    data: {
                        page: $('.grid-footer').data('page-number'),
                        selectedUrl: searchUrl
                    },
                    method: 'GET',
                    success: function (response) {
                        $('#search-ingredient-div').addClass('d-none');
                        parseResults(response);
                        searchAlphabetSort();
                        $.spinner().stop();
                        lazyload.lazyLoad();
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        }
        $('#ingredient-search-icon').on('click', () =>
            searchIngredient($('#ingredient-search'))
        );
        $('#ingredient-search').on('keydown', (event) => {
            if (event.key === 'Enter' || event.which === 13) {
                searchIngredient($('#ingredient-search'));
            }
        });
    },
    quantityUpdate: function () {
        $(document).on('click', '.plp-increase', function () {
            var maxOrderQty = Number($(this).siblings('input[name="maxorderqty"]').val());
            var self = $(this);
            var inputTag = $(this).siblings('input.quantity-select-plp');
            var quantity = Number(inputTag.val());
            if (quantity >= maxOrderQty) {
                $(this).addClass('disable');
            } else {
                quantity += 1;
                $(this).removeClass('disable');
                var productID = inputTag.data('pid');
                var url = inputTag.data('action');
                var urlParams = {
                    pid: productID,
                    quantity: quantity,
                    plp: true
                };
                $.ajax({
                    url: url,
                    method: 'POST',
                    data: urlParams,
                    success: function (data) {
                        $('.minicart').trigger('count:update', data);
                        inputTag.val(quantity).trigger('change');
                        if (quantity >= maxOrderQty) {
                            self.addClass('disable');
                        }
                        if (
                            data.newBonusDiscountLineItem &&
                            Object.keys(data.newBonusDiscountLineItem).length !== 0
                        ) {
                            chooseBonusProducts(data.newBonusDiscountLineItem);
                        }
                        $('body').trigger('cart:update', data);
                    }
                });
            }
        });

        $('body').on('click', '.quantity-field > .plp-decrease', function () {
            var maxOrderQty = Number($(this).siblings('input[name="maxorderqty"]').val());
            var increaseButton = $(this).siblings('.plp-increase');
            var inputTag = $(this).siblings('input.quantity-select-plp');
            var quantity = Number(inputTag.val());
            quantity -= 1;
            var productID = inputTag.data('pid');
            var url = inputTag.data('action');
            var urlParams = {
                pid: productID,
                quantity: quantity,
                plp: true
            };
            $.ajax({
                url: url,
                method: 'POST',
                data: urlParams,
                success: function (data) {
                    $('.minicart').trigger('count:update', data);
                    inputTag.val(quantity).trigger('change');
                    if (quantity <= maxOrderQty) {
                        increaseButton.removeClass('disable');
                    }
                    $('body').trigger('cart:update', data);
                }
            });
            if (quantity === 0) {
                $(this).closest('.product-tile').find('button.add-to-cart').show();
                $(this).closest('.plp-simple-quantity').hide();
            }
        });

        $(function () {
            $('.left-navigation-top-offers .category-top-items ul').removeClass('dropdown-menu');
            $('.left-navigation-top-offers .category-top-items li').removeClass('dropdown-item');
            var dataText = $('.left-navigation-top-offers').data('text');
            $('.left-navigation-top-offers .category-top-offers span').text(dataText.toUpperCase()).css('font-weight', 'bold');
        });

    }
};
