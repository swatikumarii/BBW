'use strict';


var base = require('base/product/base');
var layout = require('../utils/layout');

/**
 * Retrieves the relevant pid value
 * @param {jQuery} $el - DOM container for a given add to cart button
 * @returns {string} - value to be used when adding product to cart
 */
function getPidValue($el) {
    var pid;

    if ($('#quickViewModal').hasClass('show') && !$('.product-set').length) {
        pid = $($el).closest('.modal-content').find('.product-quickview').data('pid');
    } else if ($('.product-set-detail').length || $('.product-set').length) {
        pid = $($el).closest('.product-detail').find('.product-id').text();
    } else {
        pid =
            $('.product-detail:not(".bundle-item")').data('pid') ||
            ($el && $el.data('pid'));
    }

    return pid;
}

/**
 * Retrieves url to use when adding a product to the cart
 * @returns {string} - The provided URL to use when adding a product to the cart
 */
function getAddToCartUrl() {
    return $('.add-to-cart-url').val();
}

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 * @returns {object} - Object with properties body and footer.
 */
function parseHtml(html) {
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

    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="chooseBonusProductModal" tabindex="-1" role="dialog">'
        + '<span class="enter-message sr-only" ></span>'
        + '<div class="modal-dialog choose-bonus-product-dialog" '
        + 'data-total-qty="' + data.maxBonusItems + '"'
        + 'data-UUID="' + data.uuid + '"'
        + 'data-pliUUID="' + data.pliUUID + '"'
        + 'data-addToCartUrl="' + data.addToCartUrl + '"'
        + 'data-pageStart="0"'
        + 'data-pageSize="' + data.pageSize + '"'
        + 'data-moreURL="' + data.showProductsUrlRuleBased + '"'
        + 'data-bonusChoiceRuleBased="' + data.bonusChoiceRuleBased + '">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '    <span class="">' + data.labels.selectprods + '</span>'
        + '    <button type="button" class="close pull-right" data-dismiss="modal">'
        + '        <span aria-hidden="true">&times;</span>'
        + '        <span class="sr-only"> </span>'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '<div class="modal-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
    $('.modal-body').spinner().start();

    $.ajax({
        url: bonusUrl,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            var parsedHtml = parseHtml(response.renderedTemplate);
            $('#chooseBonusProductModal .modal-body').empty();
            $('#chooseBonusProductModal .enter-message').text(response.enterDialogMessage);
            $('#chooseBonusProductModal .modal-header .close .sr-only').text(response.closeButtonText);
            $('#chooseBonusProductModal .modal-body').html(parsedHtml.body);
            $('#chooseBonusProductModal .modal-footer').html(parsedHtml.footer);
            $('#chooseBonusProductModal').modal('show');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success';
    // show add to cart toast
    if (response.newBonusDiscountLineItem
        && Object.keys(response.newBonusDiscountLineItem).length !== 0) {
        chooseBonusProducts(response.newBonusDiscountLineItem);
    } else {
        if ($('.add-to-cart-messages').length === 0) {
            $('body').append(
                '<div class="add-to-cart-messages"></div>'
            );
        }

        $('.add-to-cart-messages').append(
            '<div class="alert ' + messageType + ' add-to-basket-alert text-center" role="alert">'
            + response.message
            + '</div>'
        );

        setTimeout(function () {
            $('.add-to-basket-alert').remove();
        }, 5000);
    }
}

/**
 * Retrieves the bundle product item ID's for the Controller to replace bundle master product
 * items with their selected variants
 * @returns {string[]} - List of selected bundle product item ID's
 */
function getChildProducts() {
    var childProducts = [];
    $('.bundle-item').each(function () {
        childProducts.push({
            pid: $(this).find('.product-id').text(),
            quantity: parseInt($(this).find('label.quantity').data('quantity'), 10)
        });
    });

    return childProducts.length ? JSON.stringify(childProducts) : [];
}

/**
 * Retrieve product options
 * @param {jQuery} $productContainer - DOM element for current product
 * @returns {string} - Product options and their selected values
 */
function getOptions($productContainer) {
    var options = $productContainer
        .find('.product-option')
        .map(function () {
            var $elOption = $(this).find('.options-select');
            var urlValue = $elOption.val();
            var selectedValueId = $elOption.find('option[value="' + urlValue + '"]')
                .data('value-id');
            return {
                optionId: $(this).data('option-id'),
                selectedValueId: selectedValueId
            };
        }).toArray();

    return JSON.stringify(options);
}

module.exports = $.extend({}, base, {
    addToCart: function () {
        $(document).on(
            'click',
            'button.add-to-cart, button.add-to-cart-global',
            function () {
                var addToCartUrl;
                var pid;
                var pidsObj;
                var setPids;

                var currentAction = $(this);
                $('body').trigger('product:beforeAddToCart', this);

                if (
                    $('.set-items').length &&
                    $(this).hasClass('add-to-cart-global')
                ) {
                    setPids = [];

                    $('.product-detail').each(function () {
                        if (!$(this).hasClass('product-set-detail')) {
                            setPids.push({
                                pid: $(this).find('.product-id').text(),
                                qty: $(this).find('.quantity-select').val(),
                                options: getOptions($(this))
                            });
                        }
                    });
                    pidsObj = JSON.stringify(setPids);
                }

                pid = getPidValue($(this));

                var $productContainer = $(this).closest('.product-detail');
                if (!$productContainer.length) {
                    $productContainer = $(this)
                        .closest('.quick-view-dialog')
                        .find('.product-detail');
                }

                addToCartUrl = getAddToCartUrl();

                var form = {
                    pid: pid,
                    pidsObj: pidsObj,
                    childProducts: getChildProducts(),
                    quantity: base.getQuantitySelected($(this)) || 1
                };

                if (!$('.bundle-item').length) {
                    form.options = getOptions($productContainer);
                }

                $(this).trigger('updateAddToCartFormData', form);
                if (addToCartUrl) {
                    $.ajax({
                        url: addToCartUrl,
                        method: 'POST',
                        data: form,
                        success: function (data) {
                            handlePostCartAdd(data);
                            $('body').trigger('product:afterAddToCart', data);
                            if (layout.isDesktop()) {
                                $('.minicart .popover').addClass('show');
                                $('.minicart-overlay').addClass('show');
                                $('body').addClass('overflow-hidden');
                                var minicartURL =
                                    $('.minicart').data('action-url');
                                $('.minicart .popover').spinner().start();
                                $.get(minicartURL, function (minicartData) {
                                    $('.minicart .popover').empty();
                                    $('.minicart .popover').append(
                                        minicartData
                                    );
                                });
                            } else {
                                var addToCartSnackbar = $('#add-to-cart-snackbar');
                                addToCartSnackbar.addClass('show');
                                setTimeout(function () {
                                    addToCartSnackbar.removeClass('show');
                                }, 3000);
                            }
                            if ($('.gift-card-form').length > 0) {
                                $('.gift-card-form')[0].reset();
                            }
                            $.spinner().stop();
                            base.miniCartReportingUrl(data.reportingURL);
                            return true;
                        },
                        error: function (err) {
                            currentAction
                                .siblings('.add-to-cart-error')
                                .text(err.responseJSON.errorMessage);
                            $.spinner().stop();
                        }
                    });
                }
            }
        );
    }
});
