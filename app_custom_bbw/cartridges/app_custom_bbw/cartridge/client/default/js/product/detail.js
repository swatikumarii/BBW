'use strict';

var detail = require('base/product/detail');
var base = require('./base');

module.exports = $.extend({}, detail, {
    quantityUpdate: function () {
        $(document).on('click', '.quantity-field > .increase', function () {
            var quantity = Number($(this).siblings('#Quantity').val());
            quantity += 1;
            $(this).siblings('#Quantity').val(quantity).trigger('change');
            $(this).fadeTo(100, 0.1).fadeTo(200, 1.0);
        });

        $(document).on('click', '.quantity-field > .decrease', function () {
            var quantity = Number($(this).siblings('#Quantity').val());
            if (quantity !== 1) {
                quantity -= 1;
                $(this).siblings('#Quantity').val(quantity).trigger('change');
            }
            $(this).fadeTo(100, 0.1).fadeTo(200, 1.0);
        });

        $(document).on('keyup', '.quantity-field > #Quantity', function () {
            var quantity = Number($(this).val());
            if (quantity < 1) {
                quantity = 1;
                $(this).val(quantity).trigger('change');
            }
            var maxOrderQty = Number($('input[name="maxOrderQty"]').val());
            if (quantity > maxOrderQty) {
                $(this).val(maxOrderQty).trigger('change');
                $('.reserve-stock').removeClass('d-none');
            } else {
                $('.reserve-stock').addClass('d-none');
            }
        });
    },

    beforeAddToCartEventUpdate: function () {
        $('body').on('product:beforeAddToCart', function (e) {
            $.spinner().stop();
            e.stopPropagation();
        });
    },

    afterAddToCartEventUpdate: function () {
        $('body').on('product:afterAddToCart', function () {
            $('.reserve-stock').addClass('d-none');
        });
    },

    availability: base.availability,

    addToCart: base.addToCart,

    focusChooseBonusProductModal: base.focusChooseBonusProductModal()
});

/** PDP Accordion */
$('.card:first').find('.title').removeClass('collapsed');
$('.card:first').find('.content').addClass('show');

/* Zoom Image */
$('.zoomImage-link, .carousel-item').on('click', function () {
    $('.zoomImage-sec').css('display', 'block');
});
$('.zoomOut-link').on('click', function () {
    $('.zoomImage-sec').css('display', 'none');
});
