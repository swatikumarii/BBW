'use strict';

var detail = require('base/product/detail');

/**
 * click event for add to cart funstionality
 */
function addToCart() {
    $(document).on('click', 'button.add-order-to-cart', function (event) {
        event.stopPropagation();

        var thisData = this;
        $(thisData).spinner().start();
        var form = {
            orderNumber: $(thisData).data('oid')
        };
        var addToCartUrl = $('.add-order-to-cart-url').val();
        if (addToCartUrl) {
            $.ajax({
                url: addToCartUrl,
                method: 'POST',
                data: form,
                success: function (data) {
                    window.location.href = data.redirectUrl;
                    $(thisData).spinner().stop();
                },
                error: function () {
                    $(thisData).spinner().stop();
                }
            });
        }
    });
}

var exportDetails = $.extend({}, detail, {
    addToCart: addToCart
});

module.exports = exportDetails;
var base = require('./base');

module.exports = $.extend({}, detail, {
    availability: base.availability,

    addToCart: base.addToCart,

    focusChooseBonusProductModal: base.focusChooseBonusProductModal()
});
