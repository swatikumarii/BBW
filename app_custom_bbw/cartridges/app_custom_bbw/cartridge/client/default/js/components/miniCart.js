'use strict';

var cart = require('../cart/cart');
var layout = require('../utils/layout');
var lazyload = require('../utils/lazyLoad');

var updateMiniCart = true;
var location = window.location;

module.exports = function () {
    cart();

    $(document).on('click', '.minicart-login-btn', function () {
        $('.loginPopup').find('#loginModal').modal('show');
        $('input[name="loginRedirectUrl"]').val('Cart-Show');
        $('input[name="loginRedirectQueryString"]').val('');
    });

    $('.minicart').on('count:update', function (event, count) {
        if (count && $.isNumeric(count.quantityTotal)) {
            $('.minicart .minicart-quantity').text(count.quantityTotal);
            $('.minicart .minicart-link').attr({
                'aria-label': count.minicartCountOfItems,
                title: count.minicartCountOfItems
            });
        }
    });

    $('.minicart .minicart-total').on('click', function () {
        if ($(this).parents('.minicart').hasClass('popup')) {
            window.location.href = $(this)
                .parents('.minicart')
                .data('redirect-url');
        } else {
            if (
                $('.search:visible').length === 0 ||
                $(this).find('.popover').hasClass('show')
            ) {
                return;
            }
            var url = $('.minicart').data('action-url');
            if (!updateMiniCart) {
                $('.popover').scrollTop(0);
                $('.mini-cart-content').scrollTop(0);
                $('body').addClass('overflow-hidden');
                $('.minicart .popover').addClass('show');
                $('.minicart-overlay').addClass('show');
                return;
            }

            $('body').addClass('overflow-hidden');
            $('.minicart .popover').spinner().start();
            $.get(url, function (data) {
                $('.minicart .popover').empty();
                $('.minicart .popover').append(data);
                updateMiniCart = false;
                $.spinner().stop();
            });
            $('.minicart .popover').addClass('show');
            $('.minicart-overlay').addClass('show');
        }
    });

    $('.minicart.popup .minicart-total,.minicart.popup .popover')
        .on('mouseenter', function () {
            var count = parseInt($('.minicart .minicart-quantity').text(), 10);
            if (count > 0) {
                if (
                    $('.search:visible').length === 0 ||
                    $(this).find('.popover').hasClass('show')
                ) {
                    return;
                }
                var url = $('.minicart').data('action-url');
                if (!updateMiniCart) {
                    $('.popover').scrollTop(0);
                    $('.mini-cart-content').scrollTop(0);
                    $('.minicart .popover').addClass('show');
                    return;
                }
                $('.minicart .popover').spinner().start();
                $.get(url, function (data) {
                    $('.minicart .popover').empty();
                    $('.minicart .popover').append(data);
                    updateMiniCart = false;
                    $.spinner().stop();
                });
                $('.minicart .popover').addClass('show');
            }
        })
        .on('mouseleave', function () {
            $('.minicart .popover').removeClass('show');
        });

    $('body, .minicart-overlay').on('touchstart click', function (e) {
        if ($('.minicart').has(e.target).length <= 0) {
            $('.minicart .popover').removeClass('show');
            $('.minicart-overlay').removeClass('show');
            $('body').removeClass('overflow-hidden');
            $('.minicart-recommendation-side-panel-wrap').removeClass('open');
            $('.minicart-recommendation-side-panel').removeClass(
                'show-recommendation-panel'
            );
        }
    });
    $(document).on('click', '.minicart-close-icon', function () {
        $('.minicart .popover').removeClass('show');
        $('.minicart-overlay').removeClass('show');
        $('body').removeClass('overflow-hidden');
        $('.minicart-recommendation-side-panel-wrap').removeClass('open');
        $('.minicart-recommendation-side-panel').removeClass(
            'show-recommendation-panel'
        );
    });
    $('body').on('change', '.minicart .quantity', function () {
        if (
            $(this).parents('.bonus-product-line-item').length &&
            $('.cart-page').length
        ) {
            location.reload();
        }
    });
    $('body').on('product:afterAddToCart', function () {
        updateMiniCart = true;
        var isPopupMinicart = $('.minicart').hasClass('popup');
        if (layout.isDesktop() || layout.isTablet()) {
            $('.minicart .popover').addClass('show');
            if (!isPopupMinicart) {
                $('.minicart-overlay').addClass('show');
                $('body').addClass('overflow-hidden');
            }
            var minicartURL = $('.minicart').data('action-url');
            $.get(minicartURL, function (minicartData) {
                $('.minicart .popover').empty();
                $('.minicart .popover').append(minicartData);
            });
            if (isPopupMinicart) {
                setTimeout(() => {
                    $('.minicart .popover').removeClass('show');
                }, 3000);
            }
        }
    });
    $('body').on('cart:update', function () {
        updateMiniCart = true;
    });

    $(document)
        .on('mouseleave', '.promo-details', function () {
            setTimeout(function () {     
                $('.promo-details-tooltip').removeClass('d-block');
            }, 50);
        })
        .on('mouseenter', '.promo-details', function () {
            var tooltip = $(this)
                .closest('.promo-details-wrap')
                .find('.promo-details-tooltip');
            tooltip.addClass('d-block');
        });

    $('.promo-details-tooltip .close').on('click', function () {
        $('.promo-details-tooltip').addClass('d-none');

        setTimeout(function () {
            $('.promo-details-tooltip').removeClass('d-none');
        }, 300);
    });

    /**
     * Minicart - Click - Close recommendation panel
     */
    $(document).on('click', '.js-cart-recomm-close', function (e) {
        e.preventDefault();
        $('.minicart-recommendation-side-panel-wrap').removeClass('open');
        $('.minicart-recommendation-side-panel').removeClass(
            'show-recommendation-panel'
        );
    });

    $(document).on('click', '.minicart .minicart-total', function () {
        setTimeout(function () {
            if ($('.minicart .popover').hasClass('show')) {
                $('.minicart-recommendation-side-panel-wrap').addClass('open');
                $('.minicart-recommendation-side-panel').addClass(
                    'show-recommendation-panel'
                );
                lazyload.lazyLoad();
            }
        }, 2000);
    });
};
