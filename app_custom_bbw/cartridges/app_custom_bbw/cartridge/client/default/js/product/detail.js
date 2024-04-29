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
    availability: base.availability,

    addToCart: base.addToCart,

    focusChooseBonusProductModal: base.focusChooseBonusProductModal()
});
