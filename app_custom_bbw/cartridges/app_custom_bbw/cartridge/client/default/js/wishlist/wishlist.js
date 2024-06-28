'use strict';

var wishlist = require('wishlist/wishlist/wishlist');
var base = require('base/product/base');

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success';
    if (response.message) {
        if ($('.add-to-cart-messages').length === 0) {
            $('body').append('<div class="add-to-cart-messages"></div>');
        }

        $('.add-to-cart-messages').append(
            '<div class="alert ' +
                messageType +
                ' add-to-basket-alert text-left h-fw--semibold show" role="alert">' +
                response.message +
                '</div>'
        );
    }
    messageType = 'alert-success';
    if (response.removeMessage) {
        if ($('.add-to-cart-messages').length === 0) {
            $('body').append('<div class="add-to-cart-messages"></div>');
        }

        $('.add-to-basket-alert').remove();
        $('.add-to-cart-messages').append(
            '<div class="alert first-message ' +
                messageType +
                ' add-to-basket-alert text-left h-fw--semibold show" role="alert">' +
                response.removeMessage +
                '</div>'
        );
    }
    setTimeout(function () {
        $('.add-to-basket-alert').remove();
    }, 5000);
}

$(document).ready(function () {
    if (localStorage.getItem('addToWishListPid') && localStorage.getItem('addToWishListURL')){
        $.ajax({
            url: localStorage.getItem('addToWishListURL'),
            type: 'post',
            dataType: 'json',
            data: {
                pid: localStorage.getItem('addToWishListPid')
            },
        });
        localStorage.removeItem('addToWishListPid');
        localStorage.removeItem('addToWishListURL');
    }
});

/**
 * @param {object} $elementAppendTo - The element to append error html to
 * @param {string} msg - The error message
 * display error message if remove item from wishlist failed
 */
function displayErrorMessage($elementAppendTo, msg) {
    if ($('.remove-from-wishlist-messages').length === 0) {
        $elementAppendTo.append(
            '<div class="remove-from-wishlist-messages "></div>'
        );
    }
    $('.remove-from-wishlist-messages').append(
        '<div class="remove-from-wishlist-alert text-center alert-danger">' +
            msg +
            '</div>'
    );

    setTimeout(function () {
        $('.remove-from-wishlist-messages').remove();
    }, 3000);
}

/**
 * renders the list up to a given page number
 * @param {number} pageNumber - current page number
 * @param {boolean} spinner - if the spinner has already started
 * @param {string} focusElementSelector - selector of the element to focus on
 */
function renderNewPageOfItems(pageNumber, spinner, focusElementSelector) {
    var publicView = $('.wishlistItemCardsData').data('public-view');
    var listUUID = $('.wishlistItemCardsData').data('uuid');
    var url = $('.wishlistItemCardsData').data('href');
    if (spinner) {
        $.spinner().start();
    }
    var scrollPosition = document.documentElement.scrollTop;
    var newPageNumber = pageNumber;
    $.ajax({
        url: url,
        method: 'get',
        data: {
            pageNumber: ++newPageNumber,
            publicView: publicView,
            id: listUUID
        }
    })
        .done(function (data) {
            $('.wishlistItemCards').empty();
            $('body .wishlistItemCards').append(data);

            if (focusElementSelector) {
                $(focusElementSelector).focus();
            } else {
                document.documentElement.scrollTop = scrollPosition;
            }
        })
        .fail(function () {
            $('.more-wl-items').remove();
        });
    $.spinner().stop();
}

/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 */

module.exports = $.extend({}, wishlist, {
    addToWishlist: function () {
        $(document).on('click', '.product-quickview .add-to-wish-list, .product-line-item .add-to-wish-list', function (e) {
            e.preventDefault();
            var self= $(this);
            var url = $(this).data('href') || $(this).attr('href');
            var pid =
                $(this).closest('.product-detail').length > 0
                    ? $(this).closest('.product-detail').attr('data-pid')
                    : $(this)
                        .closest('.product, .product-line-item')
                        .attr('data-pid');
            var optionId = $(this).closest('.product-detail').attr('data-option-id');
            var optionVal = $(this).closest('.product-detail').attr('data-value-id');
            optionId = optionId || null;
            optionVal = optionVal || null;
            if (!url || !pid) {
                return;
            }
            // $(this).attr('disabled', true);
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: {
                    pid: pid,
                    optionId: optionId,
                    optionVal: optionVal
                },
                success: function (data) {
                    if(data.loginShow === true){
                        $('#quickViewModal').modal('hide');
                        $('.loginPopup').find('#loginModal').modal('show');
                        localStorage.setItem('addToWishListPid', pid);
                        localStorage.setItem('addToWishListURL', url);
                    } else {
                        $('.loginPopup').find('#exampleModalLong').modal('hide');
                        $('.wishlist-toast.toast')
                            .toast('show')
                            .slideDown('slow');
                        setTimeout(function () {
                            $('.wishlist-toast.toast')
                                .toast('hide')
                                .slideUp('slow');
                        }, 3000);
                    }
                    if (data.success) {
                        self.siblings('.remove-from-wishlist').removeClass('d-none');
                        self.addClass('d-none');
                    } else {
                        self.siblings('.remove-from-wishlist').addClass('d-none');
                        self.removeClass('d-none');
                    }
                },
            });
        });
    },

    removeFromWishlist: function () {
        $('body').on('click', '.product-detail .remove-from-wishlist, .product-quickview .remove-from-wishlist, .product-line-item .remove-from-wishlist, .line-item-header .remove-from-wishlist', function (e) {
            e.preventDefault();
            var url = $(this).data('url');
            var elMyAccount = $('.account-wishlist-item').length;
            var isReloadRequired = $('.is-reload-required-while-remove').val();

            // If user is in my account page, call removeWishlistAccount() end point, re-render wishlist cards
            if (elMyAccount > 0) {
                $('.wishlist-account-card').spinner().start();
                $.ajax({
                    url: url,
                    type: 'get',
                    dataType: 'html',
                    data: {},
                    success: function (html) {
                        $('.wishlist-account-card>.card').remove();
                        $('.wishlist-account-card').append(html);
                        $('.wishlist-account-card').spinner().stop();
                        $('.remove-from-wishlist').addClass('d-none');
                        $('.add-to-wish-list').removeClass('d-none');
                        $('.remove-from-wishlist').removeClass('d-block');
                        $('.added-to-wish-list').removeClass('d-block');
                    },
                    error: function () {
                        var $elToAppend = $('.wishlist-account-card');
                        $elToAppend.spinner().stop();
                        var msg = $elToAppend.data('error-msg');
                        displayErrorMessage($elToAppend, msg);
                    }
                });
                // else user is in wishlist landing page, call removeProduct() end point, then remove this card
            } else {
                $.ajax({
                    url: url,
                    type: 'get',
                    dataType: 'json',
                    data: {},
                    success: function () {
                        if (isReloadRequired) {
                            window.location.reload();
                        } else {
                            var pageNumber =
                                $('.wishlistItemCardsData').data('page-number') - 1;
                            renderNewPageOfItems(pageNumber, false);
                            $('.remove-from-wishlist').addClass('d-none');
                            $('.add-to-wish-list').removeClass('d-none');
                            $('.remove-from-wishlist').removeClass('d-block');
                            $('.added-to-wish-list').removeClass('d-block');
                        }
                    },
                    error: function () {
                        var $elToAppendWL = $('.wishlistItemCards');
                        var msg = $elToAppendWL.data('error-msg');
                        displayErrorMessage($elToAppendWL, msg);
                    }
                });
            }
        });
    },
    addToCartFromWishlist: function () {
        $('body').on('click', '.add-to-cart', function () {
            var pid;
            var addToCartUrl;
            var pidsQty;

            $('body').trigger('product:beforeAddToCart', this);

            pid = $(this).data('pid');
            addToCartUrl = $(this).data('url');
            pidsQty = parseInt(
                $(this).closest('.product-info').find('.quantity').val(),
                10
            );

            var form = {
                pid: pid,
                quantity: pidsQty
            };

            if ($(this).data('option')) {
                form.options = JSON.stringify($(this).data('option'));
            }

            $(this).trigger('updateAddToCartFormData', form);
            if (addToCartUrl) {
                $.ajax({
                    url: addToCartUrl,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                        if (data.isGiftCardLineItemExist) {
                            $('#delete-gift-certificate-line-item-modal').modal(
                                'show'
                            );
                            $('.delete-egiftitem-confirmation-btn').attr(
                                'data-pid',
                                data.pid
                            );
                            $.spinner().stop();
                            return true;
                        }
                        handlePostCartAdd(data);
                        $('body').trigger('product:afterAddToCart', data);
                        $.spinner().stop();
                        base.miniCartReportingUrl(
                            data.reportingURL,
                            data.error
                        );
                        return true;
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        });
    }
});
