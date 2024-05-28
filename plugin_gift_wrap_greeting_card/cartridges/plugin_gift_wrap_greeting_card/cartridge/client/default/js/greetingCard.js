'use strict';

/**
 * re-renders the order totals and the number of items in the cart
 * @param {string} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml =
        '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' +
        message +
        '</div>';

    $('.cart-error').append(errorHtml);
}

/**
 * Add greeting card to cart
 */
function addGreetingCardToCart() {
    var addToCartUrl = $('#addGreetingCardProduct').attr('data-actionurl');
    var form;
    var pid = $('input[name="greeting-card"]:checked').val();
    var quantity = 1;
    var greetingCardMessage = $('.js-personal-message-textarea').val();
    form = {
        pid: pid,
        quantity: quantity,
        greetingCardMessage: greetingCardMessage
    };
    $('#addGreetingCardProduct').trigger('updateAddToCartFormData', form);
    if (addToCartUrl) {
        $.ajax({
            url: addToCartUrl,
            method: 'POST',
            data: form,
            success: function () {
                window.location.reload();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                }
            }
        });
    }
}

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
 * re-renders the order totals and the number of items in the cart
 * @param {object} data - AJAX response from the server
 */
function updateCartTotals(data) {
    $('.number-of-items').empty().append(data.resources.numberOfItems);
    $('.shipping-cost').empty().append(data.totals.totalShippingCost);
    $('.tax-total').empty().append(data.totals.totalTax);
    $('.grand-total').empty().append(data.totals.grandTotal);
    $('.sub-total').empty().append(data.totals.subTotal);
    $('.minicart-quantity').empty().append(data.numItems);
    $('.minicart-link').attr({
        'aria-label': data.resources.minicartCountOfItems,
        title: data.resources.minicartCountOfItems
    });
    if (data.totals.orderLevelDiscountTotal.value > 0) {
        $('.order-discount').removeClass('hide-order-discount');
        $('.order-discount-total').empty()
            .append('- ' + data.totals.orderLevelDiscountTotal.formatted);
    } else {
        $('.order-discount').addClass('hide-order-discount');
    }

    if (data.totals.shippingLevelDiscountTotal.value > 0) {
        $('.shipping-discount').removeClass('hide-shipping-discount');
        $('.shipping-discount-total').empty().append('- '
            + data.totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.shipping-discount').addClass('hide-shipping-discount');
    }

    data.items.forEach(function (item) {
        if (data.totals.orderLevelDiscountTotal.value > 0) {
            $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
        }
        if (item.renderedPromotions) {
            $('.item-' + item.UUID).empty().append(item.renderedPromotions);
        } else {
            $('.item-' + item.UUID).empty();
        }
        $('.uuid-' + item.UUID + ' .unit-price').empty().append(item.renderedPrice);
        $('.line-item-price-' + item.UUID + ' .unit-price').empty().append(item.renderedPrice);
        $('.item-total-' + item.UUID).empty().append(item.priceTotal.renderedPrice);
    });
}

/**
 * re-renders the approaching discount messages
 * @param {object} approachingDiscounts - updated approaching discounts for the cart
 */
function updateApproachingDiscounts(approachingDiscounts) {
    var html = '';
    $('.approaching-discounts').empty();
    if (approachingDiscounts.length > 0) {
        approachingDiscounts.forEach(function (item) {
            html += '<div class="single-approaching-discount text-center">'
                + item.discountMsg + '</div>';
        });
    }
    $('.approaching-discounts').append(html);
}

/**
 * Checks whether the basket is valid. if invalid displays error message and disables
 * checkout button
 * @param {object} data - AJAX response from the server
 */
function validateBasket(data) {
    if (data.valid.error) {
        if (data.valid.message) {
            var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error '
                + 'fade show" role="alert">'
                + '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'
                + '<span aria-hidden="true">&times;</span>'
                + '</button>' + data.valid.message + '</div>';

            $('.cart-error').append(errorHtml);
        } else {
            $('.cart').empty().append('<div class="row"> '
                + '<div class="col-12 text-center"> '
                + '<h1>' + data.resources.emptyCartMsg + '</h1> '
                + '</div> '
                + '</div>');
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
        $('.checkout-btn').removeClass('disabled');
    }
}

/**
 * Remove Greeting card product
 * @param {string} actionUrl - action Url for removing product from cart
 * @param {string} uuid - product uuid
 * @param {string} pid - product pid
 */
function removeGreetingCardFromCart(actionUrl, uuid, pid) {
    var urlParams = {
        pid: pid,
        uuid: uuid
    };
    var url = appendToUrl(actionUrl, urlParams);
    $.ajax({
        url: url,
        type: 'get',
        dataType: 'json',
        success: function (data) {
            if (
                data.toBeDeletedUUIDs &&
                data.toBeDeletedUUIDs.length > 0
            ) {
                for (var i = 0; i < data.toBeDeletedUUIDs.length; i++) {
                    $('.uuid-' + data.toBeDeletedUUIDs[i]).remove();
                }
            }
            $('.uuid-' + uuid).remove();
            if (!data.basket.hasBonusProduct) {
                $('.bonus-product').remove();
            }
            $('.coupons-and-promos').empty().append(data.basket.totals.discountsHtml);
            updateCartTotals(data.basket);
            updateApproachingDiscounts(
                data.basket.approachingDiscounts
            );
            $('body').trigger(
                'setShippingMethodSelection',
                data.basket
            );
            validateBasket(data.basket);
        },
        error: function (err) {
            if (err.responseJSON.redirectUrl) {
                window.location.href = err.responseJSON.redirectUrl;
            } else {
                createErrorNotification(err.responseJSON.errorMessage);
            }
        }
    });
}

/**
 * Clear greeting card isml
 */
function clearGreetingCardIsml() {
    $('.greeting-block-options').css('display', 'none');
    $('#addGreetingCardProduct').removeClass('update');
    $('#addGreetingCardProduct').html(
        $('#addGreetingCardProduct').data('add-text')
    );
    $('#greetingcard').prop('checked', false);
    $('input:radio[name=greeting-card]:first').attr('checked', true);
    $('.selected-greetingcard-price').html(
        $('input[name="greeting-card"]:checked').data('price')
    );
    $('.js-personal-message-textarea').html('');
    $('.greetingCard-edit-product').css('display', 'none');
}

/**
 * Reset greeting card isml.
 * This will hide products, select radio button and set greeting card message
 */
function resetGreetingCardIsml() {
    $('.greeting-block-options').css('display', 'none');
    var greetingCardPid = $('.greeting-card').data('pid');
    if (greetingCardPid) {
        $('#addGreetingCardProduct').addClass('update');
        $('#addGreetingCardProduct').html(
            $('#addGreetingCardProduct').data('update-text')
        );
        $('#greetingcard').prop('checked', true);
        $('input:radio[value=' + greetingCardPid + ']').prop('checked', true);
        $('.selected-greetingcard-price').html(
            $('.greeting-card').data('price')
        );
        $('.js-personal-message-textarea').html(
            $('.greeting-card').data('text')
        );
    } else {
        clearGreetingCardIsml();
    }
    var greetingCardMessageLimit = $('.js-personal-message-textarea').attr(
        'maxLength'
    );
    $('.js-char-left').html(
        '(' +
            (greetingCardMessageLimit -
                $('.js-personal-message-textarea').val().length) +
            ' / ' +
            greetingCardMessageLimit +
            ')'
    );
}

$(document).ready(function () {
    resetGreetingCardIsml();
    var greetingCardMessageLimit = $('.js-personal-message-textarea').attr(
        'maxLength'
    );
    $('.js-personal-message-textarea').on('keyup', function () {
        $('.js-char-left').html(
            '(' +
                (greetingCardMessageLimit - $(this).val().length) +
                ' / ' +
                greetingCardMessageLimit +
                ')'
        );
    });

    $(document).on('click', '#addGreetingCardProduct', function () {
        if ($('.js-personal-message-textarea').val().length === 0) {
            createErrorNotification(
                $('.js-personal-message-textarea').data('error-message-blank')
            );
            return;
        }
        if (
            $('.js-personal-message-textarea').val().length >
            greetingCardMessageLimit
        ) {
            createErrorNotification(
                $('.js-personal-message-textarea')
                    .data('error-message-morethan')
                    .replace('#', greetingCardMessageLimit)
            );
            return;
        }
        if (!$('input[name="greeting-card"]:checked').val()) {
            createErrorNotification(
                $('.greetingCardProductOptions').data(
                    'error-message-select-radio'
                )
            );
            return;
        }
        if ($(this).hasClass('update')) {
            if ($('.greeting-card').data('pid') ===
                    $('input[name="greeting-card"]:checked').val() &&
                $('.greeting-card').data('text') ===
                    $('.js-personal-message-textarea').val()
            ) {
                $('.greeting-block-options').css('display', 'none');
            } else {
                addGreetingCardToCart();
            }
        } else {
            addGreetingCardToCart();
        }
    });

    $(document).on('click', '.js-greetingcard-cancel', function () {
        resetGreetingCardIsml();
    });

    $(document).on('click', '.greetingCard-edit-product', function () {
        $('.greeting-block-options').css('display', 'block');
        $('.greeting-block').addClass('open-greeting-card');
    });

    $(document).on('click', '#greetingcard', function () {
        if ($('#greetingcard').is(':checked')) {
            $('.greeting-block-options').css('display', 'block');
            $('.greeting-block').addClass('open-greeting-card');
        } else {
            $('.greeting-block-options').css('display', 'none');
            $('.greeting-block').removeClass('open-greeting-card');
            if ($('.greeting-card').data('pid')) {
                removeGreetingCardFromCart(
                    $('#addGreetingCardProduct').data('removeurl'),
                    $('.greeting-card').data('uuid'),
                    $('.greeting-card').data('pid')
                );
                clearGreetingCardIsml();
            }
        }
    });

    $(document).on('click', '.greetingCardProductOptionsRadio', function () {
        $('.selected-greetingcard-price').html($(this).data('price'));
    });
});
