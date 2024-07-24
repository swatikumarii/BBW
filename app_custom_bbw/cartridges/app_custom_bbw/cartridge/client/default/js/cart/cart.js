'use strict';

var base = require('../product/base');
var focusHelper = require('base/components/focus');

/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendToUrl(url, params) {
    var newUrl = url;
    newUrl +=
        (newUrl.indexOf('?') !== -1 ? '&' : '?') +
        Object.keys(params)
            .map(function (key) {
                return key + '=' + encodeURIComponent(params[key]);
            })
            .join('&');

    return newUrl;
}

/**
 * Get params from a querystring
 * @param {string} name - paramtert name
 * @param {string} queryString - Querystring
 * @returns {string} value of the given parameter in the querystring.
 */
function getParameterByName(name, queryString) {
    if (queryString.startsWith('?')) {
        queryStringA = queryString.substring(1);
    }
    var params = queryStringA.split('&');
    // Iterate over the key-value pairs
    for (var param of params) {
        var [key, value] = param.split('=');

        if (key === name) {
            return decodeURIComponent(value || ''); 
        }
    }
    return null; 
}

/**
 * Clear error notification
 */
function clearErrorNotification() {
    if ($('.cart-error .d-block') && $('.cart-error .d-block').length > 0) {
        $('.cart-error .d-block').remove();
    }
}

/**
 * Checks whether the basket is valid. if invalid displays error message and disables
 * checkout button
 * @param {object} data - AJAX response from the server
 */
function validateBasket(data) {
    if (data.valid.error) {
        if (data.valid.message) {
            $('.pdict-message').remove();
            var errorHtml =
                '<span class="pdict-message">' + data.valid.message + '</span>';
            clearErrorNotification();
            $('.cart-error').append(errorHtml);
        } else {
            $('.cart')
                .empty()
                .append(
                    '<div class="row"> ' +
                        '<div class="col-12 text-center"> ' +
                        '<h1>' +
                        data.resources.emptyCartMsg +
                        '</h1> ' +
                        '</div> ' +
                        '</div>'
                );
            $('.number-of-items').empty().append(data.resources.numberOfItems);
            $('.minicart-quantity').empty().append(data.numItems);
            $('.minicart-link').attr({
                'aria-label': data.resources.minicartCountOfItems,
                title: data.resources.minicartCountOfItems
            });
            $('.minicart .popover').empty();
            $('.minicart .popover').removeClass('show');
        }

        $('.checkout-btn').addClass('disabled');
    } else {
        $('.cart-error').remove();
        $('.checkout-btn').removeClass('disabled');
    }
}

/**
 * re-renders the order totals and the number of items in the cart
 * @param {object} data - AJAX response from the server
 */
function updateCartTotals(data) {
    if (data.hasFreeShipping) {
        $('.shipping-cost').empty().append('FREE');
        $('.shipping-discount').addClass('d-none');
        $('.shipping-tax').closest('div.row').addClass('d-none');
    } else {
        $('.shipping-discount').removeClass('d-none');
        if ($('.shipping-cost').hasClass('tax-exclusive')) {
            $('.shipping-cost')
                .empty()
                .append(data.totals.shippingTotalExclTax);
        } else {
            $('.shipping-cost').empty().append(data.totals.totalShippingCost);
        }
        $('.shipping-tax').closest('div.row').removeClass('d-none');
    }
    $('.number-of-items').empty().append(data.resources.numberOfItems);
    if ($('.sub-total').hasClass('tax-exclusive')) {
        $('.sub-total').empty().append(data.totals.subTotalExclTax);
    } else {
        $('.sub-total').empty().append(data.totals.subTotal);
    }
    $('.tax-total').empty().append(data.totals.totalTax);
    $('.grand-total').empty().append(data.totals.grandTotal);
    $('.minicart-quantity').empty().append(data.numItems);
    $('.cart-num-items').empty().append(data.numItems);
    $('.minicart-link').attr({
        'aria-label': data.resources.minicartCountOfItems,
        title: data.resources.minicartCountOfItems
    });
    if (data.totals.allDiscounts.length > 0) {
        $('.order-discount').removeClass('hide-order-discount');
        $('.order-discount').empty().append(data.totals.allDiscountsHTML);
    } else {
        $('.order-discount').addClass('hide-order-discount');
    }

    if (data.totals.shippingLevelDiscountTotal.value > 0) {
        $('.shipping-discount').removeClass('hide-shipping-discount');
        $('.shipping-discount-total')
            .empty()
            .append('- ' + data.totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.shipping-discount').addClass('hide-shipping-discount');
    }

    data.items.forEach(function (item) {
        if (data.totals.orderLevelDiscountTotal.value > 0) {
            $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
        }
        if (item.promotionsHTML) {
            $('line-item-promo.item-' + item.UUID)
                .empty()
                .append(item.promotionsHTML);
        } else {
            $('line-item-promo.item-' + item.UUID).empty();
        }
        if (item.promoPrice !== false) {
            var promoPriceHTML =
                '<div class="strike-through h-clr--black-1">' +
                item.price.sales.formatted +
                '</div>' +
                '<div class="pricing promo-price h-clr--red">' +
                item.promoPrice +
                '</div>';
            $('.uuid-' + item.UUID + ' .unit-price')
                .empty()
                .append(promoPriceHTML);
        } else {
            $('.uuid-' + item.UUID + ' .unit-price')
                .empty()
                .append(item.renderedPrice);
        }
        var totalSavingsHTML = '';
        var lineItemSavingDiv = $('.uuid-' + item.UUID + ' .line-item-savings');
        if (item.totalSavings && item.totalSavings !== '-') {
            totalSavingsHTML =
                '<span class="d-inline d-md-none">' +
                'Saved:' +
                '</span>' +
                '<span class="value">' +
                item.totalSavings +
                '</span>';
            lineItemSavingDiv.empty().append(totalSavingsHTML);
        } else {
            totalSavingsHTML =
                '<span class="value value-dash d-none d-md-block">' +
                '-' +
                '</span>';
            lineItemSavingDiv.empty().append(totalSavingsHTML);
        }
        var motivatorHTML = '';
        if ('promotions' in item && item.promotions) {
            item.promotions.forEach(function (promotion) {
                if (promotion.motivator && promotion.motivator !== 'false') {
                    motivatorHTML +=
                        '<div class="h-font-size--14 h-fw--semibold">\n' +
                        promotion.motivator +
                        '\n' +
                        '</div>\n';
                }
            });
        }
        $('.line-item-promo-motivator.item-' + item.UUID)
            .empty()
            .append(motivatorHTML);
        $('.item-total-' + item.UUID)
            .empty()
            .append(item.priceTotal.renderedPrice);
    });

    // update free item toast message
    if (data.freeItemCount > 0) {
        $('.free-item-toast-message').removeClass(
            'hide-free-item-toast-message'
        );
        $('.free-item-toast-message').empty().append(data.freeItemToastMessage);
    } else {
        $('.free-item-toast-message').addClass('hide-free-item-toast-message');
    }
}

/**
 * re-renders the order totals and the number of items in the cart
 * @param {object} message - Error message to display
 */
function createErrorNotification(message) {
    clearErrorNotification();
    var errorHtml = '<span class="d-block">' + message + '</span>';
    $('.cart-error').append(errorHtml);
}

/**
 * re-renders the approaching discount messages
 * @param {object} orderApproachingDiscounts - updated approaching discounts for the cart
 * @param {object} shippingApproachingDiscounts - updated approaching discounts for the cart
 * @param {boolean} isMiniCart - to check minicart or cart page
 */
function updateApproachingDiscounts(
    orderApproachingDiscounts,
    shippingApproachingDiscounts,
    isMiniCart
) {
    var orderhtml = '';
    var shippinghtml = '';
    if (orderApproachingDiscounts && orderApproachingDiscounts.length) {
        orderhtml =
            '<div class="d-flex w-auto align-items-center single-approaching-discount-wrap">\n';
        orderhtml +=
            '<div class="single-approaching-discount d-flex flex-column w-100 pl-3">\n' +
            orderApproachingDiscounts[0].discountMsg +
            // '<progress class="w-100" value="' + (orderApproachingDiscounts[0].conditionThreshold - orderApproachingDiscounts[0].distanceFromConditionThreshold) + '" max="' + orderApproachingDiscounts[0].conditionThreshold + '"></progress>\n'+
            '</div>\n';
        if ('image' in orderApproachingDiscounts[0]) {
            orderhtml +=
                '<div>\n' +
                '<img src="' +
                orderApproachingDiscounts[0].image +
                '" alt="product image" width="50" />\n' +
                '</div>';
        }
        orderhtml += '</div>';
    }

    if (shippingApproachingDiscounts && shippingApproachingDiscounts.length && !isMiniCart) {
        shippinghtml =
            '<div class="row align-items-center">\n' +
            '<div class="d-flex flex-column col-12 py-0">\n' +
            '<p class="h-font-size--16 h-clr--pink h-fw--semibold m-0 text-center">' +
            shippingApproachingDiscounts[0].discountMsg +
            '</p>\n' +
            '<div class="d-flex w-100 justify-content-around align-items-center progress-wrap">\n' +
            '<span class="pr-3 text-nowrap d-block h-font-size--16 h-fw--bold"> AU$ 0.00 </span>\n' +
            '<span class="d-block w-100 h-pos--relative">\n' +
            '<progress class="w-100" value="' +
            (shippingApproachingDiscounts[0].conditionThreshold -
                shippingApproachingDiscounts[0]
                    .distanceFromConditionThreshold) +
            '" max="' +
            shippingApproachingDiscounts[0].conditionThreshold +
            '"></progress>\n' +
            '<span class="free-shipping-progress" style="left: calc(' +
            (
                ((shippingApproachingDiscounts[0].conditionThreshold -
                    shippingApproachingDiscounts[0]
                        .distanceFromConditionThreshold) /
                    shippingApproachingDiscounts[0].conditionThreshold) *
                100
            ).toFixed(2) +
            '% - 25px );"></span>\n' +
            '</span>\n' +
            '<span class="pl-3 text-nowrap d-block h-font-size--16 h-fw--bold">\n' +
            shippingApproachingDiscounts[0].formattedConditionThreshold +
            '</span>\n' +
            '</div>\n' +
            '</div>\n' +
            '</div>';
    } else if (shippingApproachingDiscounts && shippingApproachingDiscounts.length && isMiniCart) {
        shippinghtml =
            '<div class="row align-items-center">\n' +
            '<div class="d-flex flex-column col-12 py-0">\n' +
            '<p class="h-font-size--16 h-clr--pink h-fw--semibold m-0 text-center">' +
            shippingApproachingDiscounts[0].discountMsg +
            '</p>\n' +
            '</div>\n' +
            '</div>';
    }
    $('.shipping-approaching-discounts').empty().append(shippinghtml);
    $('.order-approaching-discounts').empty().append(orderhtml);
}

/**
 * Updates the availability of a product line item
 * @param {object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */
function updateAvailability(data, uuid) {
    var lineItem;
    var messages = '';

    for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].UUID === uuid) {
            lineItem = data.items[i];
            break;
        }
    }

    if (lineItem !== null) {
        $('.availability-' + lineItem.UUID).empty();

        if (lineItem.availability) {
            if (lineItem.availability.messages) {
                lineItem.availability.messages.forEach(function (message) {
                    var colorClass = lineItem.available ? '' : 'h-clr--red';
                    messages += `<p class="line-item-attributes ${colorClass}"> ${message} </p>`;
                });
            }

            if (lineItem.availability.inStockDate) {
                messages +=
                    '<p class="line-item-attributes line-item-instock-date">' +
                    lineItem.availability.inStockDate +
                    '</p>';
            }
        }

        $('.availability-' + lineItem.UUID).html(messages);
    }
}

/**
 * Finds an element in the array that matches search parameter
 * @param {Array} array - array of items to search
 * @param {Function} match - function that takes an element and returns a boolean indicating if the match is made
 * @returns {object} - returns an element of the array that matched the query.
 */
// function findItem(array, match) {
//     // eslint-disable-line no-unused-vars
//     for (var i = 0, l = array.length; i < l; i++) {
//         if (match.call(this, array[i])) {
//             return array[i];
//         }
//     }
//     return null;
// }

/**
 * Updates details of a product line item
 * @param {object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */
function updateProductDetails(data, uuid) {
    $('.card.product-info.uuid-' + uuid).replaceWith(data.renderedTemplate);
}

/**
 * Generates the modal window on the first call.
 *
 */
function getModalHtmlElement() {
    if ($('#editProductModal').length !== 0) {
        $('#editProductModal').remove();
    }
    var htmlString =
        '<!-- Modal -->' +
        '<div class="modal fade" id="editProductModal" tabindex="-1" role="dialog">' +
        '<span class="enter-message sr-only" ></span>' +
        '<div class="modal-dialog quick-view-dialog">' +
        '<!-- Modal content-->' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
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
}

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 * @returns {object} - Object with properties body and footer.
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.product-quickview');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
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
 * replaces the content in the modal window for product variation to be edited.
 * @param {string} editProductUrl - url to be used to retrieve a new product model
 */
function fillModalElement(editProductUrl) {
    $('.modal-body').spinner().start();
    $.ajax({
        url: editProductUrl,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            var parsedHtml = parseHtml(data.renderedTemplate);

            $('#editProductModal .modal-body').empty();
            $('#editProductModal .modal-body').html(parsedHtml.body);
            $('#editProductModal .modal-footer').html(parsedHtml.footer);
            $('#editProductModal .modal-header .close .sr-only').text(
                data.closeButtonText
            );
            $('#editProductModal .enter-message').text(data.enterDialogMessage);
            $('#editProductModal').modal('show');
            $('body').trigger('editproductmodal:ready');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * replace content of modal
 * @param {string} actionUrl - url to be used to remove product
 * @param {string} productID - pid
 * @param {string} productName - product name
 * @param {string} uuid - uuid
 */
function confirmDelete(actionUrl, productID, productName, uuid) {
    var $deleteConfirmBtn = $('.cart-delete-confirmation-btn');
    var $productToRemoveSpan = $('.product-to-remove');

    $deleteConfirmBtn.data('pid', productID);
    $deleteConfirmBtn.data('action', actionUrl);
    $deleteConfirmBtn.data('uuid', uuid);

    $productToRemoveSpan.empty().append(productName);
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
            var parsedHtml = parseBonusHtml(response.renderedTemplate);
            $('#chooseBonusProductModal .modal-body').empty();
            $('#chooseBonusProductModal .enter-message').text(
                response.enterDialogMessage
            );
            $('#chooseBonusProductModal .modal-header .close .sr-only').text(
                response.closeButtonText
            );
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

module.exports = function () {
    $('body').on('click', '.remove-product', function (e) {
        e.preventDefault();

        var actionUrl = $(this).data('action');
        var productID = $(this).data('pid');
        var productName = $(this).data('name');
        var uuid = $(this).data('uuid');
        confirmDelete(actionUrl, productID, productName, uuid);
    });

    $('body').on('afterRemoveFromCart', function (e, data) {
        e.preventDefault();
        confirmDelete(
            data.actionUrl,
            data.productID,
            data.productName,
            data.uuid
        );
    });

    $('.optional-promo').click(function (e) {
        e.preventDefault();
        $('.promo-code-form').toggle();
    });

    $('body').on('click', '.cart-delete-confirmation-btn', function (e) {
        e.preventDefault();
        clearErrorNotification();
        var productID = $(this).data('pid');
        var url = $(this).data('action');
        var uuid = $(this).data('uuid');
        var urlParams = {
            pid: productID,
            uuid: uuid
        };
        var isMiniCart = $(this).parents('.mini-cart-content').length > 0;
        var isPopupMinicart = $('body').find('.minicart').hasClass('popup');
        if (isPopupMinicart && $('.product-summary').children().length === 1) {
            $('.minicart .popover').removeClass('show');
        }

        var isInMiniCart = !($('body').find('.cart-lineitems').length > 0);

        url = appendToUrl(url, urlParams);

        $('body > .modal-backdrop').remove();

        $.spinner().start();

        $('body').trigger('cart:beforeUpdate');

        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                if (data.basket.items.length === 0) {
                    if (isMiniCart) {
                        var minicartURL = $('.minicart').data('action-url');
                        if (isPopupMinicart) {
                            $('.minicart .popover').removeClass('show');
                        } else {
                            $.get(minicartURL, function (dataMinicart) {
                                $('.minicart .popover')
                                    .empty()
                                    .append(dataMinicart);
                            });
                        }
                    } else {
                        $('.cart').remove();
                        $('.cartContainer .container').removeClass('d-none');
                    }
                    $('.number-of-items')
                        .empty()
                        .append(data.basket.resources.numberOfItems);
                    $('.minicart-quantity')
                        .empty()
                        .append(data.basket.numItems);
                    $('.minicart-link').attr({
                        'aria-label':
                            data.basket.resources.minicartCountOfItems,
                        title: data.basket.resources.minicartCountOfItems
                    });
                    $('html').removeClass('veiled');
                } else {
                    if (
                        data.toBeDeletedUUIDs &&
                        data.toBeDeletedUUIDs.length > 0
                    ) {
                        for (var i = 0; i < data.toBeDeletedUUIDs.length; i++) {
                            if (
                                $('.uuid-' + data.toBeDeletedUUIDs[i]).parent(
                                    '.card'
                                ).length >= 1
                            ) {
                                $('.uuid-' + data.toBeDeletedUUIDs[i])
                                    .parent('.card')
                                    .remove();
                            } else {
                                $(
                                    '.uuid-' +
                                        data.toBeDeletedUUIDs[i] +
                                        '.card'
                                ).remove();
                            }
                        }
                    }
                    if ($('input[name="pdpPage"]').length > 0) {
                        var motivatorUrl = $('input[name="motivatorUrl"]').val();
                        motivatorUrl += '?pid=' + $('input[name="pdpPage"]').val();
                        $.get(motivatorUrl, function (dataMotivator) {
                            $('.motivator').remove();
                            if (dataMotivator.motivator) {
                                dataMotivator.motivator.promotions.forEach(function (promotion) {
                                    if (promotion.motivator) {
                                        var html = '<div class="mb-1 motivator">' + promotion.motivator + '</div>';
                                        $('.promotions-wrap').append(html);
                                    }
                                });
                            }
                        });
                    }
                    $('.uuid-' + uuid)
                        .parent('.card')
                        .remove();
                    $('.uuid-' + uuid + '.card').remove();
                    if (data.removeProducts && data.removeProducts.length > 0) {
                        for (var j = 0; j < data.removeProducts.length; j++) {
                            if ($('.uuid-' + data.removeProducts[j])) {
                                if (
                                    $('.uuid-' + data.removeProducts[j]).parent(
                                        '.card'
                                    ).length >= 1
                                ) {
                                    $('.uuid-' + data.removeProducts[j])
                                        .parent('.card')
                                        .remove();
                                } else {
                                    $(
                                        '.uuid-' +
                                            data.removeProducts[j] +
                                            '.card'
                                    ).remove();
                                }
                            }
                        }
                    }
                    if (!data.basket.hasBonusProduct) {
                        $('.bonus-product').remove();
                    }
                    if ('refreshItems' in data && data.refreshItems) {
                        $('.cart-lineitems')
                            .empty()
                            .append(data.refreshItemsTemplate);
                        $('.mini-cart-content .product-summary')
                            .empty()
                            .append(data.refreshItemsTemplateMinicart);
                    }
                    $('.coupons-and-promos')
                        .empty()
                        .append(data.basket.totals.discountsHtml);
                    updateCartTotals(data.basket);
                    updateApproachingDiscounts(
                        data.basket.orderApproachingDiscounts,
                        data.basket.shippingApproachingDiscounts,
                        isInMiniCart
                    );
                    $('body').trigger(
                        'setShippingMethodSelection',
                        data.basket
                    );
                    validateBasket(data.basket);
                    $('.item-removed-message').removeClass('d-none');
                    if (data.basket.valid.error === false) {
                        $('.cart-error-messaging').addClass('d-none');
                    }
                }
                var pid = getParameterByName('pid', data.queryString);
                if ($('#product-search-results').length > 0) {
                    var selectorString = 'button.add-to-cart[data-pid="'+pid+'"]';
                    var $button = $(selectorString);
                    $button.show();
                    $button.siblings('.plp-simple-quantity').hide();
                }

                $('body').trigger('cart:update', data);

                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });

    $(document).on('click', '.quantity-form > .quantity-plus', function () {
        var pid = $(this).siblings('input').data('pid');
        var uuid = $(this).siblings('input').data('uuid');
        var quantity = Number($(this).siblings('.quantity').val());
        var totalExistingQuantity = 0;
        var maxOrderQty = $(this).siblings('.quantity').data('max-order-qty');
        var allQuantityElements = $('input.quantity');
        $.each(allQuantityElements, function () {
            if ($(this).data('pid') === pid && $(this).data('uuid') !== uuid) {
                totalExistingQuantity += Number($(this).val());
            }
        });

        quantity += 1;
        if (
            maxOrderQty &&
            Number(maxOrderQty) - totalExistingQuantity < quantity
        ) {
            var errorElem = $(this)
                .parents('.quantity-form')
                .siblings('.max-order-qty-error');
            errorElem.show();
            setTimeout(function () {
                errorElem.hide();
            }, 4500);
        } else {
            $(this).siblings('.quantity').val(quantity).trigger('change');
        }
    });

    $(document).on('click', '.quantity-form > .quantity-minus', function () {
        var quantity = Number($(this).siblings('.quantity').val());
        quantity -= 1;
        if (quantity > 0) {
            $(this).siblings('.quantity').val(quantity).trigger('change');
        }
    });

    $('body').on('change', '.quantity-form > .quantity', function () {
        clearErrorNotification();
        var preSelectQty = $(this).data('pre-select-qty');
        var quantity = Number($(this).val());
        var self = $(this);
        var isMiniCart = $(this).parents('.mini-cart-content').length > 0;
        var isMiniCartTrigger = $(this).parents('.popover').length > 0;
        var isCartPageTrigger = $(this).parents('.cart-page').length > 0;
        var productID = $(this).data('pid');
        var url = $(this).data('action');
        var uuid = $(this).data('uuid');

        var urlParams = {
            pid: productID,
            quantity: quantity,
            uuid: uuid,
            isMiniCartTrigger: isMiniCartTrigger,
            isCartPageTrigger: isCartPageTrigger
        };
        url = appendToUrl(url, urlParams);

        $(this).parents('.card').spinner().start();

        $('body').trigger('cart:beforeUpdate');

        $.ajax({
            url: url,
            type: 'get',
            context: this,
            dataType: 'json',
            success: function (data) {
                if (data.error) {
                    if (data.errorCode === 'ZERO-PRICE-PRODUCT') {
                        createErrorNotification(data.errorMessage);
                        $.spinner().stop();
                    }
                    return;
                }
                $('.quantity[data-uuid="' + uuid + '"]').val(quantity);
                var totalExistingQuantity = 0;
                var allQuantityElements = $('input.quantity');
                var pid = self.data('pid');
                var UUID = self.data('uuid');
                $.each(allQuantityElements, function () {
                    if (
                        $(this).data('pid') === pid &&
                        $(this).data('uuid') !== UUID
                    ) {
                        totalExistingQuantity += Number($(this).val());
                    }
                });
                if (data.updatedQty) {
                    self.data('pre-select-qty', data.updatedQty);
                    if (Number(self.val()) !== data.updatedQty) {
                        self.val(data.updatedQty);
                        self.closest('.line-item-quantity')
                            .find('.max-order-qty-error')
                            .show();
                        setTimeout(function () {
                            self.closest('.line-item-quantity')
                                .find('.max-order-qty-error')
                                .hide();
                        }, 5000);
                    } else if (
                        data.updatedQty + totalExistingQuantity <=
                        Number(self.data('max-order-qty'))
                    ) {
                        self.closest('.line-item-quantity')
                            .find('.max-order-qty-error')
                            .hide();
                    }
                }
                $('.coupons-and-promos')
                    .empty()
                    .append(data.totals.discountsHtml);
                updateCartTotals(data);
                updateApproachingDiscounts(
                    data.orderApproachingDiscounts,
                    data.shippingApproachingDiscounts,
                    isMiniCart
                );
                updateAvailability(data, uuid);
                validateBasket(data);
                $('body').trigger('cart:update', data);
                if ('refreshItems' in data && data.refreshItems) {
                    $('.cart-lineitems')
                        .empty()
                        .append(data.refreshItemsTemplate);
                    $('.mini-cart-content .product-summary')
                        .empty()
                        .append(data.refreshItemsTemplateMinicart);
                }
                if (
                    data.newBonusDiscountLineItem &&
                    Object.keys(data.newBonusDiscountLineItem).length !== 0
                ) {
                    chooseBonusProducts(data.newBonusDiscountLineItem);
                }
                $.spinner().stop();
                // if (
                //     $(this)
                //         .parents('.product-info')
                //         .hasClass('bonus-product-line-item') &&
                //     $('.cart-page').length
                // ) {
                //     location.reload();
                // }
            },
            error: function (err) {
                self.closest('.line-item-quantity')
                    .find('.max-order-qty-error')
                    .show();
                setTimeout(function () {
                    self.closest('.line-item-quantity')
                        .find('.max-order-qty-error')
                        .hide();
                }, 5000);
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    self.val(parseInt(preSelectQty, 10));
                    $.spinner().stop();
                }
            }
        });
    });

    $('.shippingMethods').change(function () {
        clearErrorNotification();
        var isMiniCart = $(this).parents('.mini-cart-content').length > 0;
        var url = $(this).attr('data-actionUrl');
        var urlParams = {
            methodID: $(this).find(':selected').attr('data-shipping-id')
        };
        // url = appendToUrl(url, urlParams);

        $('.totals').spinner().start();
        $('body').trigger('cart:beforeShippingMethodSelected');
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: urlParams,
            success: function (data) {
                if (data.error) {
                    window.location.href = data.redirectUrl;
                } else {
                    $('.coupons-and-promos')
                        .empty()
                        .append(data.totals.discountsHtml);
                    updateCartTotals(data);
                    updateApproachingDiscounts(
                        data.orderApproachingDiscounts,
                        data.shippingApproachingDiscounts,
                        isMiniCart
                    );
                    validateBasket(data);
                }

                $('body').trigger('cart:shippingMethodSelected', data);
                $.spinner().stop();
            },
            error: function (err) {
                if (err.redirectUrl) {
                    window.location.href = err.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });

    $('.promo-code-form').submit(function (e) {
        clearErrorNotification();
        e.preventDefault();
        $.spinner().start();
        $('.coupon-missing-error').hide();
        $('.coupon-error-message').empty();
        $('.coupon-error-message').removeClass('d-block');
        if (!$('.coupon-code-field').val()) {
            $('.promo-code-form .form-control').addClass('is-invalid');
            $('.promo-code-form .form-control').attr(
                'aria-describedby',
                'missingCouponCode'
            );
            $('.coupon-missing-error').show();
            $.spinner().stop();
            return false;
        }
        var $form = $('.promo-code-form');
        $('.promo-code-form .form-control').removeClass('is-invalid');
        $('.coupon-error-message').empty();
        $('body').trigger('promotion:beforeUpdate');
        var isMiniCart = $(this).parents('.mini-cart-content').length > 0;

        $.ajax({
            url: $form.attr('action'),
            type: 'GET',
            dataType: 'json',
            data: $form.serialize(),
            success: function (data) {
                if (data.error) {
                    $('.promo-code-form .form-control').addClass('is-invalid');
                    $('.promo-code-form .form-control').attr(
                        'aria-describedby',
                        'invalidCouponCode'
                    );
                    $('.coupon-error-message')
                        .empty()
                        .append(data.errorMessage);
                    $('.coupon-error-message').addClass('d-block');
                    setTimeout(function () {
                        $('.coupon-error-message').empty();
                        $('.coupon-error-message').removeClass('d-block');
                        $('.promo-code-form .form-control').removeClass(
                            'is-invalid'
                        );
                    }, 3000);
                    $('body').trigger('promotion:error', data);
                } else {
                    $('.coupon-error-message').removeClass('d-block');
                    $('.coupons-and-promos')
                        .empty()
                        .append(data.totals.discountsHtml);
                    updateCartTotals(data);
                    updateApproachingDiscounts(
                        data.orderApproachingDiscounts,
                        data.shippingApproachingDiscounts,
                        isMiniCart
                    );
                    validateBasket(data);
                    $('body').trigger('promotion:success', data);
                }
                $('.coupon-code-field').val('');
                $.spinner().stop();
            },
            error: function (err) {
                $('body').trigger('promotion:error', err);
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.errorMessage);
                    $.spinner().stop();
                }
            }
        });
        return false;
    });

    $(document).on(
        'click',
        '.checkout-promo-code-form .promo-code-form button',
        function () {
            var isMiniCart = $(this).parents('.mini-cart-content').length > 0;
            $.ajax({
                url: $('.promo-code-form').attr('action'),
                type: 'GET',
                dataType: 'json',
                data: $('.promo-code-form :input').serialize(),
                success: function (data) {
                    if (data.error) {
                        $('.promo-code-form .form-control').addClass(
                            'is-invalid'
                        );
                        $('.promo-code-form .form-control').attr(
                            'aria-describedby',
                            'invalidCouponCode'
                        );
                        $('.coupon-error-message')
                            .empty()
                            .append(data.errorMessage);
                        $('.coupon-error-message').addClass('d-block');
                        setTimeout(function () {
                            $('.coupon-error-message').empty();
                            $('.coupon-error-message').removeClass('d-block');
                            $('.promo-code-form .form-control').removeClass(
                                'is-invalid'
                            );
                        }, 3000);
                        $('body').trigger('promotion:error', data);
                    } else {
                        $('.coupon-error-message').removeClass('d-block');
                        $('.coupons-and-promos')
                            .empty()
                            .append(data.totals.discountsHtml);
                        updateCartTotals(data);
                        updateApproachingDiscounts(
                            data.orderApproachingDiscounts,
                            data.shippingApproachingDiscounts,
                            isMiniCart
                        );
                        validateBasket(data);
                        $('body').trigger('promotion:success', data);
                    }
                    $('.coupon-code-field').val('');
                    if ($('.remove-giftcard-btn').length > 0) {
                        $('.remove-giftcard-btn').click();
                        $('.coupon-gc-error-wrap').removeClass('d-none');
                    }
                    $.spinner().stop();
                },
                error: function (err) {
                    $('body').trigger('promotion:error', err);
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        createErrorNotification(err.errorMessage);
                        $.spinner().stop();
                    }
                }
            });
        }
    );

    $('body').on('click', '.remove-coupon', function (e) {
        e.preventDefault();

        var couponCode = $(this).data('code');
        var uuid = $(this).data('uuid');
        var $deleteConfirmBtn = $('.delete-coupon-confirmation-btn');
        var $productToRemoveSpan = $('.coupon-to-remove');

        $deleteConfirmBtn.data('uuid', uuid);
        $deleteConfirmBtn.data('code', couponCode);

        $productToRemoveSpan.empty().append(couponCode);
    });

    $('body').on('click', '.delete-coupon-confirmation-btn', function (e) {
        e.preventDefault();
        clearErrorNotification();
        var isMiniCart = $(this).parents('.mini-cart-content').length > 0;
        var url = $(this).data('action');
        var uuid = $(this).data('uuid');
        var couponCode = $(this).data('code');
        var urlParams = {
            code: couponCode,
            uuid: uuid
        };

        url = appendToUrl(url, urlParams);

        $('body > .modal-backdrop').remove();

        $.spinner().start();
        $('body').trigger('promotion:beforeUpdate');
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $('.coupon-uuid-' + uuid).remove();
                updateCartTotals(data);
                updateApproachingDiscounts(
                    data.orderApproachingDiscounts,
                    data.shippingApproachingDiscounts,
                    isMiniCart
                );
                validateBasket(data);
                $.spinner().stop();
                $('body').trigger('promotion:success', data);
            },
            error: function (err) {
                $('body').trigger('promotion:error', err);
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });
    $('body').on('click', '.bonus-product-button', function () {
        $.spinner().start();
        $(this).addClass('launched-modal');
        $.ajax({
            url: $(this).data('url'),
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                base.methods.editBonusProducts(data);
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });

    $('body').on('hidden.bs.modal', '#chooseBonusProductModal', function () {
        $('#chooseBonusProductModal').remove();
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open');

        if ($('.cart-page').length) {
            $('.launched-modal .btn-outline-primary').trigger('focus');
            $('.launched-modal').removeClass('launched-modal');
        } else {
            $('.product-detail .add-to-cart').focus();
        }
    });

    $('body').on(
        'click',
        '.cart-page .product-edit .edit, .cart-page .bundle-edit .edit',
        function (e) {
            e.preventDefault();

            var editProductUrl = $(this).attr('href');
            getModalHtmlElement();
            fillModalElement(editProductUrl);
        }
    );

    $('body').on('shown.bs.modal', '#editProductModal', function () {
        $('#editProductModal').siblings().attr('aria-hidden', 'true');
        $('#editProductModal .close').focus();
    });

    $('body').on('hidden.bs.modal', '#editProductModal', function () {
        $('#editProductModal').siblings().attr('aria-hidden', 'false');
    });

    $('body').on('keydown', '#editProductModal', function (e) {
        var focusParams = {
            event: e,
            containerSelector: '#editProductModal',
            firstElementSelector: '.close',
            lastElementSelector: '.update-cart-product-global',
            nextToLastElementSelector: '.modal-footer .quantity-select'
        };
        focusHelper.setTabNextFocus(focusParams);
    });

    $('body').on('product:updateAddToCart', function (e, response) {
        // update global add to cart (single products, bundles)
        var dialog = $(response.$productContainer).closest(
            '.quick-view-dialog'
        );

        $('.update-cart-product-global', dialog).attr(
            'disabled',
            !$('.global-availability', dialog).data('ready-to-order') ||
                !$('.global-availability', dialog).data('available')
        );
    });

    $('body').on('product:updateAvailability', function (e, response) {
        // bundle individual products
        $('.product-availability', response.$productContainer)
            .data('ready-to-order', response.product.readyToOrder)
            .data('available', response.product.available)
            .find('.availability-msg')
            .empty()
            .html(response.message);

        var dialog = $(response.$productContainer).closest(
            '.quick-view-dialog'
        );

        if ($('.product-availability', dialog).length) {
            // bundle all products
            var allAvailable = $('.product-availability', dialog)
                .toArray()
                .every(function (item) {
                    return $(item).data('available');
                });

            var allReady = $('.product-availability', dialog)
                .toArray()
                .every(function (item) {
                    return $(item).data('ready-to-order');
                });

            $('.global-availability', dialog)
                .data('ready-to-order', allReady)
                .data('available', allAvailable);

            $('.global-availability .availability-msg', dialog)
                .empty()
                .html(
                    allReady
                        ? response.message
                        : response.resources.info_selectforstock
                );
        } else {
            // single product
            $('.global-availability', dialog)
                .data('ready-to-order', response.product.readyToOrder)
                .data('available', response.product.available)
                .find('.availability-msg')
                .empty()
                .html(response.message);
        }
    });

    $('body').on('product:afterAttributeSelect', function (e, response) {
        if ($('.modal.show .product-quickview .bundle-items').length) {
            $('.modal.show')
                .find(response.container)
                .data('pid', response.data.product.id);
            $('.modal.show')
                .find(response.container)
                .find('.product-id')
                .text(response.data.product.id);
        } else {
            $('.modal.show .product-quickview').data(
                'pid',
                response.data.product.id
            );
        }
    });

    $('body').on('change', '.quantity-select', function () {
        var selectedQuantity = $(this).val();
        $('.modal.show .update-cart-url').data(
            'selected-quantity',
            selectedQuantity
        );
    });

    $('body').on('change', '.options-select', function () {
        var selectedOptionValueId = $(this)
            .children('option:selected')
            .data('value-id');
        $('.modal.show .update-cart-url').data(
            'selected-option',
            selectedOptionValueId
        );
    });

    $('body').on('click', '.update-cart-product-global', function (e) {
        e.preventDefault();
        clearErrorNotification();
        var isMiniCart = $(this).parents('.mini-cart-content').length > 0;
        var updateProductUrl = $(this)
            .closest('.cart-and-ipay')
            .find('.update-cart-url')
            .val();
        var selectedQuantity = $(this)
            .closest('.cart-and-ipay')
            .find('.update-cart-url')
            .data('selected-quantity');
        var selectedOptionValueId = $(this)
            .closest('.cart-and-ipay')
            .find('.update-cart-url')
            .data('selected-option');
        var uuid = $(this)
            .closest('.cart-and-ipay')
            .find('.update-cart-url')
            .data('uuid');

        var form = {
            uuid: uuid,
            pid: base.getPidValue($(this)),
            quantity: selectedQuantity,
            selectedOptionValueId: selectedOptionValueId
        };

        $(this).parents('.card').spinner().start();

        $('body').trigger('cart:beforeUpdate');

        if (updateProductUrl) {
            $.ajax({
                url: updateProductUrl,
                type: 'post',
                context: this,
                data: form,
                dataType: 'json',
                success: function (data) {
                    $('#editProductModal').modal('hide');

                    $('.coupons-and-promos')
                        .empty()
                        .append(data.cartModel.totals.discountsHtml);
                    updateCartTotals(data.cartModel);
                    updateApproachingDiscounts(
                        data.cartModel.orderApproachingDiscounts,
                        data.cartModel.shippingApproachingDiscounts,
                        isMiniCart
                    );
                    updateAvailability(data.cartModel, uuid);
                    updateProductDetails(data, uuid);

                    if (data.uuidToBeDeleted) {
                        $('.uuid-' + data.uuidToBeDeleted).remove();
                    }

                    validateBasket(data.cartModel);

                    $('body').trigger('cart:update', data);

                    $.spinner().stop();
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        createErrorNotification(err.responseJSON.errorMessage);
                        $.spinner().stop();
                    }
                }
            });
        }
    });

    $('body').on('click', '.applyTopOffer', function (e) {
        e.preventDefault();
        var action = $(this).data('action');
        var couponCode = $(this).data('coupon');
        var csrfTokenFieldName = $('.topOfferCsrfToken').attr('name');
        var csrfTokenValue = $('.topOfferCsrfToken').val();
        var formData =
            'couponCode=' +
            couponCode +
            '&' +
            csrfTokenFieldName +
            '=' +
            csrfTokenValue;
        $.ajax({
            url: action,
            type: 'GET',
            contentType: false,
            data: formData,
            processData: false,
            success: function (data) {
                if (data.error) {
                    $('.topOfferSuccess').hide();
                    $('.topOfferError').text(data.errorMessage);
                    $('.topOfferError').show();
                    setTimeout(function () {
                        $('.topOfferError').hide();
                    }, 5000);
                } else {
                    updateCartTotals(data);
                    $('.topOfferError').hide();
                    $('.topOfferSuccess').text(data.resources.couponApplied);
                    $('.topOfferSuccess').show();
                    setTimeout(function () {
                        $('.topOfferSuccess').hide();
                    }, 5000);
                }
            },
            error: function () {
                $('.topOfferSuccess').hide();
                $('.topOfferError').text($('.something-went-wrong').text());
                $('.topOfferError').show();
                setTimeout(function () {
                    $('.topOfferError').hide();
                }, 5000);
            }
        });
    });

    $('.cart-checkout-btn').on('click', function (e) {
        e.preventDefault();
        var checkFreeURL = $(this).data('check-motivator');
        var url = $(this).attr('href');
        $.ajax({
            type: 'GET',
            url: checkFreeURL,
            success: function (data) {
                if (data.loosingFree) {
                    $('#addFreeModalButton').trigger('click');
                } else {
                    window.location.href = url;
                }
            },
            error: function () {
                window.location.href = url;
            }
        });
    });

    // Show popover on mouseenter
    $('[data-toggle="popover"]').on('mouseenter', function () {
        $(this).popover('show');
        $('.pdp-title').parents('.bs-popover-right').addClass('pdp-popover');
    });

    $('[data-toggle="popover"]').on('click', function () {
        $('[data-toggle="popover"]').popover('hide');
        $(this).popover('show');
    });

    // Event for apply promo code
    $('body').on('click', '.dynamic-popup-apply-promo', function (e) {
        e.preventDefault();
        var action = $('.add-coupon-url').val();
        var couponCode = $(this).data('coupon');
        var csrfTokenFieldName = $('.popup-csrf-token').attr('name');
        var csrfTokenValue = $('.popup-csrf-token').val();
        var formData =
            'couponCode=' +
            couponCode +
            '&' +
            csrfTokenFieldName +
            '=' +
            csrfTokenValue;
        $.ajax({
            url: action,
            type: 'GET',
            contentType: false,
            data: formData,
            processData: false,
            success: function (data) {
                if (data.error) {
                    $('.dynamic-popup-promo-error').text(data.errorMessage);
                    $('.dynamic-popup-promo-error').show();
                } else {
                    updateCartTotals(data);
                    $('.dynamic-popup-promo-error').hide();
                    $('.dynamic-popup-dialog button.modal-close-icon').click();
                    if ($('.add-to-cart-messages').length === 0) {
                        $('body').append(
                            '<div class="add-to-cart-messages"></div>'
                        );
                    }

                    $('.add-to-basket-alert').remove();
                    $('.add-to-cart-messages').append(
                        '<div class="alert add-to-basket-alert text-left h-fw--semibold show" role="alert">' +
                            data.resources.couponApplied +
                            '</div>'
                    );
                    setTimeout(function () {
                        $('.add-to-basket-alert').remove();
                    }, 5000);
                }
            },
            error: function () {
                $('.dynamic-popup-promo-error').text(
                    $('.something-went-wrong').text()
                );
                $('.dynamic-popup-promo-error').show();
            }
        });
    });
    $(document).on('click', '.change-bonus-product', function () {
        var uuid = $(this).data('uuid');
        $('.uuid-' + uuid).parent('.card').find('.bonus-product-button').click();
    });

    // Hide responsve checkout button when scroll down
    document.addEventListener('scroll', function () {
        var myDiv = document.getElementById('secure-checkout-mbl-btn');
        var targetElement = document.getElementById('cart-mobile-checkout');
        var targetPosition = targetElement.getBoundingClientRect();
        var windowHeight =
            window.innerHeight || document.documentElement.clientHeight;

        if (targetPosition.top <= windowHeight && targetPosition.top >= 0) {
            myDiv.style.display = 'none';
        } else if (targetPosition.top < 0) {
            myDiv.style.display = 'none';
        } else {
            myDiv.style.display = 'block';
        }
    });

    base.selectAttribute();
    base.colorAttribute();
    base.removeBonusProduct();
    base.selectBonusProduct();
    base.enableBonusProductSelection();
    base.showMoreBonusProducts();
    base.addBonusProductsToCart();
    base.focusChooseBonusProductModal();
    base.trapChooseBonusProductModalFocus();
    base.onClosingChooseBonusProductModal();
};
