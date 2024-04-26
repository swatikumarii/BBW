'use strict';

var wishlist = require('wishlist/wishlist/wishlist');

/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 */

module.exports = $.extend({}, wishlist, {
    addToWishlist: function () {
        $(document).on('click', '.add-to-wish-list', function (e) {
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
            $.spinner().start();
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
                        $('.loginPopup').find('.modal').modal('show');
                    } else {
                        $('.loginPopup').find('#exampleModalLong').modal('hide');
                    }
                    if(data.success) {
                        $('.add-to-wish-list').addClass('added');
                    } else {
                        $('.add-to-wish-list').removeClass('added');
                    }
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                },
            });
        });
    }
});
