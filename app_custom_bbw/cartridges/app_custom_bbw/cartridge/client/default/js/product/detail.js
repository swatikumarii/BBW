'use strict';

var detail = require('base/product/detail');

/**
 * click event for add to cart funstionality
 */
function addToCart() {
    $(document).on('click', 'button.add-order-to-cart', function (event) {
        event.stopPropagation();

        var _this = this;
        $(_this).spinner().start();
        var form = {
            orderNumber: $(this).data('oid')
        };
        var addToCartUrl = $('.add-order-to-cart-url').val();
        if (addToCartUrl) {
            $.ajax({
                url: addToCartUrl,
                method: 'POST',
                data: form,
                success: function (data) {
                    window.location.href = data.redirectUrl;
                    $(_this).spinner().stop();
                },
                error: function () {
                    $(_this).spinner().stop();
                }
            });
        }
    });
}

var exportDetails = $.extend({}, detail, {
    addToCart: addToCart
});

module.exports = exportDetails;
