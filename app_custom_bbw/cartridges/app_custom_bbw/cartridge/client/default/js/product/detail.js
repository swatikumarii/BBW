'use strict';

var layout = require('../utils/layout');
var detail = require('base/product/detail');
var base = require('./base');

module.exports = $.extend({}, detail, {
    quantityUpdate: function () {
        $(document).on('click', '.quantity-field > .increase', function () {
            var quantity = Number($(this).siblings('#Quantity').val());
            quantity += 1;
            $(this).siblings('#Quantity').val(quantity).trigger('change');
        });

        $(document).on('click', '.quantity-field > .decrease', function () {
            var quantity = Number($(this).siblings('#Quantity').val());
            if (quantity !== 1) {
                quantity -= 1;
                $(this).siblings('#Quantity').val(quantity).trigger('change');
            }
        });

        $(document).on('change', '.quantity-field > #Quantity', function () {
            var quantity = Number($(this).val());
            if (quantity < 1) {
                quantity = 1;
                $(this).val(quantity).trigger('change');
            }
        });
    },

    beforeAddToCartEventUpdate: function () {
        $('body').on('product:beforeAddToCart', function (e) {
            $.spinner().stop();
            e.stopPropagation();
        });
    },

    availability: base.availability,

    addToCart: base.addToCart,

    focusChooseBonusProductModal: base.focusChooseBonusProductModal()
});

/** Wishlist toast message */
$('#add-to-wish-list').click(function () {
    $('.wishlist-toast.toast').toast('show');
});

/** PDP Accordion */
$('.card:first').find('.title').removeClass('collapsed');
$('.card:first').find('.content').addClass('show');

/* Zoom Image */
$('.zoomImage-link, .carousel-item').on('click', function () {
    if (layout.isDesktop() || layout.isLargeTablet()) {
        $('.zoomImage-sec').css('display', 'block');
    }
});
$('.zoomOut-link').on('click', function () {
    if (layout.isDesktop() || layout.isLargeTablet()) {
        $('.zoomImage-sec').css('display', 'none');
    }
});
