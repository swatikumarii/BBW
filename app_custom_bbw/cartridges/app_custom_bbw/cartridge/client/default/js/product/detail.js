'use strict';

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

    focusChooseBonusProductModal: base.focusChooseBonusProductModal(),

    removeEGiftCard: function () {
        $('.delete-egiftitem-confirmation-btn').on('click', function () {
            var productID = $(this).data('pid');
            var removeGiftPliUrl = $(this).data('action');
            var addToCartUrl = $(this).data('addtocarturl');
            var form = {
                pid: productID,
                quantity: 1
            };
            $.ajax({
                type: 'GET',
                url: removeGiftPliUrl,
                success: function (data) {
                    $.ajax({
                        type: 'POST',
                        url: addToCartUrl,
                        data: form,
                        success: function () {
                            base.handlePostCartAdd(data);
                            $('body').trigger('product:afterAddToCart', data);
                            $.spinner().stop();
                            base.miniCartReportingUrl(data.reportingURL);
                        },
                        error: function () {
                            $.spinner().stop();
                        }
                    });
                }
            });
        });
    },
    removeLineItem: function () {
        $('.delete-lineitem-confirmation-btn').on('click', function () {
            var productID = $(this).data('pid');
            var removeGiftPliUrl = $(this).data('action');
            var addToCartUrl = $(this).data('addtocarturl');
            var form = {
                pid: productID,
                quantity: 1
            };
            $.ajax({
                type: 'GET',
                url: removeGiftPliUrl,
                success: function (data) {
                    $.ajax({
                        type: 'POST',
                        url: addToCartUrl,
                        data: form,
                        success: function () {
                            base.handlePostCartAdd(data);
                            $('body').trigger('product:afterAddToCart', data);
                            $.spinner().stop();
                            base.miniCartReportingUrl(data.reportingURL);
                        },
                        error: function () {
                            $.spinner().stop();
                        }
                    });
                }
            });
        });
    }
});

/** Wishlist toast message */
$('#add-to-wish-list').click(function () {
    $('.toast').toast('show');
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
