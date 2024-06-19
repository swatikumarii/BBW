'use strict';

var constants = require('../../../../cartridge/config/constants.js');

/**
 * re-renders the order totals and the number of items in the cart
 * @param {object} message - Error message to display
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
 * This function will validate add form
 * @param {string} pid - Product Id
 * @param {string} giftWrapType - Gift Wrap Type
 * @param {string[]} toBeIndividuallyWrappedPids - Individual wrappable product ids
 * @returns {boolean} - If any error found then return false else true
 */
function validate(pid, giftWrapType, toBeIndividuallyWrappedPids) {
    var isValid = true;
    if (!pid) {
        createErrorNotification(
            $('#addGiftWrapProduct').data(
                'giftwrapproduct-error-message'
            )
        );
        isValid = false;
    } else if (
        !giftWrapType ||
        !(giftWrapType === constants.WRAP_INDIVIDUAL_VALUE || giftWrapType === constants.WRAP_TOGETHER_VALUE)
    ) {
        createErrorNotification(
            $('#addGiftWrapProduct').data('wraptype-error-message')
        );
        isValid = false;
    } else if (giftWrapType === constants.WRAP_INDIVIDUAL_VALUE) {
        if (toBeIndividuallyWrappedPids.length === 0) {
            createErrorNotification(
                $('#addGiftWrapProduct').data(
                    'select.wrappable.product-error-message'
                )
            );
            isValid = false;
        }
    }
    return isValid;
}
/**
 * add gift wrap product to cart
 */
function addGiftWrapToCart() {
    var pid = $('input[name="gift-wrap-product"]:checked').val();
    var addToCartUrl = $('#addGiftWrapProduct').attr('data-actionurl');
    var giftWrapType = $('input[name="giftwrap-type"]:checked').val();
    var toBeIndividuallyWrappedPids = $('input[name=individual-lineItem]:checked')
        .map(function () {
            return $(this).val();
        }).get();
    if (validate(pid, giftWrapType, toBeIndividuallyWrappedPids)) {
        var quantity = toBeIndividuallyWrappedPids.length || 1;
        var form = {
            pid: pid,
            quantity: quantity,
            giftWrapType: giftWrapType,
            toBeIndividuallyWrappedPids: JSON.stringify(
                toBeIndividuallyWrappedPids
            )
        };
        $('#addGiftWrapProduct').trigger('updateAddToCartFormData', form);
        if (addToCartUrl) {
            $.ajax({
                url: addToCartUrl,
                method: 'POST',
                data: form,
                success: function () {
                    window.location.reload();
                }
            });
        }
    }
}

/**
 * Clear gift wrap card isml
 */
function clearGiftWrapCardIsml() {
    $('.giftwrap-block-options').css('display', 'none');
    $('#addGiftWrapProduct').html($('#addGiftWrapProduct').data('add-text'));
    $('#giftwrap').prop('checked', false);
    $('input:radio[name=gift-wrap-product]:first').attr('checked', true);
    var price = $('input[name=gift-wrap-product]:checked').data('price');
    $('.selected-giftwrap-product-price').html(
        price
    );
    $('.cost-per-item-message').html(
        $('.cost-per-item-message')
            .data('cost-per-item-message')
            .replace('#', price)
    );
    $('.giftWrap-edit-product').css('display', 'none');
    if ($('#' + constants.WRAP_TOGETHER_ID).is(':enabled')) {
        $('#' + constants.WRAP_TOGETHER_ID).attr('checked', true);
    } else if ($('#' + constants.WRAP_INDIVIDUAL_ID).is(':enabled')) {
        $('#' + constants.WRAP_INDIVIDUAL_ID).attr('checked', true);
    }
}

/**
 * Reset gift wrap card isml.
 * This will hide products, select radio button and set greeting card message
 */
function resetGiftWrapIsml() {
    $('.giftwrap-block-options').css('display', 'none');
    var giftWrapCardPid = $('.gift-wrap-product-card').data('pid');
    if (giftWrapCardPid) {
        var giftCardPrice = $('.gift-wrap-product-card').data('price');
        $('#addGiftWrapProduct').html(
            $('#addGiftWrapProduct').data('update-text')
        );
        $('#giftwrap').prop('checked', true);
        $('input:radio[value=' + giftWrapCardPid + ']').prop('checked', true);
        $('.selected-giftwrap-product-price').html(giftCardPrice);
        $('.cost-per-item-message').html(
            $('.cost-per-item-message')
                .data('cost-per-item-message')
                .replace('#', giftCardPrice)
        );
        var wrapType = $('#addGiftWrapProduct').data('wrap-type');
        if (wrapType) {
            $('#' + wrapType).attr('checked', true);
        } else if ($('#' + constants.WRAP_TOGETHER_ID).is(':enabled')) {
            $('#' + constants.WRAP_TOGETHER_ID).attr('checked', true);
        } else if ($('#' + constants.WRAP_INDIVIDUAL_ID).is(':enabled')) {
            $('#' + constants.WRAP_INDIVIDUAL_ID).attr('checked', true);
        }
    } else {
        clearGiftWrapCardIsml();
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
 * Remove Gift wrap product
 * @param {string} actionUrl - action Url for removing product from cart
 * @param {string} uuid - product uuid
 * @param {string} pid - product pid
 */
function removeGiftWrapProductFromCart(actionUrl, uuid, pid) {
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
            if (data.toBeDeletedUUIDs && data.toBeDeletedUUIDs.length > 0) {
                for (var i = 0; i < data.toBeDeletedUUIDs.length; i++) {
                    $('.uuid-' + data.toBeDeletedUUIDs[i]).remove();
                }
            }
            $('.uuid-' + uuid).remove();
            if (!data.basket.hasBonusProduct) {
                $('.bonus-product').remove();
            }
            $('.coupons-and-promos')
                .empty()
                .append(data.basket.totals.discountsHtml);
            updateCartTotals(data.basket);
            updateApproachingDiscounts(data.basket.approachingDiscounts);
            $('body').trigger('setShippingMethodSelection', data.basket);
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
 * On ready
 */
$(document).ready(function () {
    resetGiftWrapIsml();
    $(document).on('change', 'input[name=individual-lineItem]', function () {
        if (this.checked) {
            if (
                $('input[name=individual-lineItem]:checked').length ===
                $('.giftservice-products').children().length
            ) {
                $('#checkall').prop('checked', true);
            }
        } else {
            $('#checkall').prop('checked', false);
        }
    });

    $(document).on('change', '#checkall', function () {
        $('.input-wrap-individual').prop('checked', this.checked);
    });

    $(document).on('click', '#addGiftWrapProduct', function () {
        addGiftWrapToCart();
    });

    $(document).on('click', '.giftWrap-edit-product', function () {
        $('.giftwrap-block-options').css('display', 'block');
    });

    $(document).on('click', '#giftwrap', function () {
        if ($('#giftwrap').is(':checked')) {
            $('.giftwrap-block-options').css('display', 'block');
            $('.gift-wrap-choose-div').addClass('open-giftwrap');
        } else {
            $('.giftwrap-block-options').css('display', 'none');
            $('.gift-wrap-choose-div').removeClass('open-giftwrap');
            if ($('.gift-wrap-product-card').data('pid')) {
                removeGiftWrapProductFromCart(
                    $('#addGiftWrapProduct').data('removeurl'),
                    $('.gift-wrap-product-card').data('uuid'),
                    $('.gift-wrap-product-card').data('pid')
                );
                clearGiftWrapCardIsml();
            }
        }
    });

    $(document).on('change', '.giftWrapProductOptionsRadio', function () {
        var selectProductPrice = $(this).data('price');
        $('.selected-giftwrap-product-price').html(selectProductPrice);
        $('.cost-per-item-message').html(
            $('.cost-per-item-message')
                .data('cost-per-item-message')
                .replace('#', selectProductPrice)
        );
    });

    $('body').on('cart:update', function (e, data) {
        $('.gift-wrap-card-div')
            .empty()
            .html(data.giftWrapProductCard);
        $('.giftWrapIndividualProductParent')
            .empty()
            .html(data.individuallyWrappableUI);
        if (!data.individuallyWrappableUI) {
            $('.gift-wrap-choose-div').empty();
        }
    });

    $('.gift-wrap-model-close').on('click', function () {
        $('.input-wrap-individual').prop('checked', false);
        $('#checkall').prop('checked', false);
    });

});
