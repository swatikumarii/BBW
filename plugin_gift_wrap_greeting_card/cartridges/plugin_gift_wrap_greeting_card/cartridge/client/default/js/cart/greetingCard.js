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
            if (
                $('.greeting-card').data('pid') ===
                    $('input[name="greeting-card"]:checked').val() &&
                $('.greeting-card').data('text') ===
                    $('.js-personal-message-textarea').val()
            ) {
                $('.greeting-block-options').css('display', 'none');
            } else {
                removeGreetingCardFromCart(
                    $(this).data('removeurl'),
                    $('.greeting-card').data('uuid'),
                    $('.greeting-card').data('pid')
                );
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
    });

    $(document).on('click', '#greetingcard', function () {
        if ($('#greetingcard').is(':checked')) {
            $('.greeting-block-options').css('display', 'block');
        } else {
            $('.greeting-block-options').css('display', 'none');
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
