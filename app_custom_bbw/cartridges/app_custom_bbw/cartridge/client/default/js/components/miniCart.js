'use strict';

var cart = require('../cart/cart');
var layout = require('../utils/layout');

var updateMiniCart = true;
var location = window.location;

module.exports = function () {
    cart();

    $('.minicart').on('count:update', function (event, count) {
        if (count && $.isNumeric(count.quantityTotal)) {
            $('.minicart .minicart-quantity').text(count.quantityTotal);
            $('.minicart .minicart-link').attr({
                'aria-label': count.minicartCountOfItems,
                title: count.minicartCountOfItems
            });
        }
    });

    $('.minicart').on('click', function () {
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
    });
    $('body, .minicart-overlay').on('touchstart click', function (e) {
        if ($('.minicart').has(e.target).length <= 0) {
            $('.minicart .popover').removeClass('show');
            $('.minicart-overlay').removeClass('show');
            $('body').removeClass('overflow-hidden');
        }
    });
    $(document).on('click', '.minicart-close-icon', function () {
        $('.minicart .popover').removeClass('show');
        $('.minicart-overlay').removeClass('show');
        $('body').removeClass('overflow-hidden');
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
        if (layout.isDesktop() || layout.isTablet()) {
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
        }
    });
    $('body').on('cart:update', function () {
        updateMiniCart = true;
    });

    $(document).on(
        'mouseenter',
        '.promo-details, .promo-details-tooltip',
        function () {
            var tooltip = $(this)
                .closest('.promo-details-wrap')
                .find('.promo-details-tooltip');
            tooltip.show();
        }
    );

    $(document).on(
        'mouseleave',
        '.promo-details, .promo-details-tooltip',
        function () {
            var tooltip = $(this)
                .closest('.promo-details-wrap')
                .find('.promo-details-tooltip');
            tooltip.hide();
        }
    );
};
