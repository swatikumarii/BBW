'use strict';

var wishlist = require('wishlist/wishlist/wishlist');

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
                    } else {
                        $('.loginPopup').find('#exampleModalLong').modal('hide');
                        $('#add-to-wish-list').click(function () {
                            $('.wishlist-toast.toast').toast('show');
                        });
                    }
                    if (data.success) {
                        $('.remove-from-wishlist').removeClass('d-none');
                        $('.add-to-wish-list').addClass('d-none');
                    } else {
                        $('.remove-from-wishlist').addClass('d-none');
                        $('.add-to-wish-list').removeClass('d-none');
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
                        var pageNumber =
                            $('.wishlistItemCardsData').data('page-number') - 1;
                        renderNewPageOfItems(pageNumber, false);
                        $('.remove-from-wishlist').addClass('d-none');
                        $('.add-to-wish-list').removeClass('d-none');
                        $('.remove-from-wishlist').removeClass('d-block');
                    },
                    error: function () {
                        var $elToAppendWL = $('.wishlistItemCards');
                        var msg = $elToAppendWL.data('error-msg');
                        displayErrorMessage($elToAppendWL, msg);
                    }
                });
            }
        });
    }
});
