'use strict';

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
 * @param {number} pid - Product Id
 * @param {string} giftWrapType - Gift Wrap Type
 * @param {number[]} toBeIndividuallyWrappedPids - Individual wrappable product ids
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
        !(giftWrapType === 'INDIVIDUAL' || giftWrapType === 'TOGETHER')
    ) {
        createErrorNotification(
            $('#addGiftWrapProduct').data('wraptype-error-message')
        );
        isValid = false;
    } else if (giftWrapType === 'INDIVIDUAL') {
        document
            .querySelectorAll('input[name=individual-lineItem]:checked')
            .forEach(function (element) {
                toBeIndividuallyWrappedPids.push(element.value);
            });
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
    var toBeIndividuallyWrappedPids = [];

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
    if ($('#wrapTogether').is(':enabled')) {
        $('#wrapTogether').attr('checked', true);
    } else if ($('#wrapIndividually').is(':enabled')) {
        $('#wrapIndividually').attr('checked', true);
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
        } else if ($('#wrapTogether').is(':enabled')) {
            $('#wrapTogether').attr('checked', true);
        } else if ($('#wrapIndividually').is(':enabled')) {
            $('#wrapIndividually').attr('checked', true);
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
                document.querySelector(
                    'input[type="checkbox"][name=checkall]'
                ).checked = true;
            }
        } else {
            document.querySelector(
                'input[type="checkbox"][name=checkall]'
            ).checked = false;
        }
    });

    $(document).on('change', '#checkall', function () {
        var checkboxes = document.querySelectorAll(
            'input[type="checkbox"][name=individual-lineItem]'
        );

        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = this.checked;
        }
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
        } else {
            $('.giftwrap-block-options').css('display', 'none');
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
        var selectProductPrice = $(this).data('price');;
        $('.selected-giftwrap-product-price').html(selectProductPrice);
        $('.cost-per-item-message').html(
            $('.cost-per-item-message')
                .data('cost-per-item-message')
                .replace('#', selectProductPrice)
        );
    });
});
