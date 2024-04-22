'use strict';

var base = require('base/product/base');

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success';

    if ($('.add-to-cart-messages').length === 0) {
        $('body').append('<div class="add-to-cart-messages"></div>');
    }

    $('.add-to-cart-messages').append(
        '<div class="alert ' +
            messageType +
            ' add-to-basket-alert text-center" role="alert">' +
            response.message +
            '</div>'
    );

    setTimeout(function () {
        $('.add-to-basket-alert').remove();
    }, 5000);
}

/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 */

module.exports = {
    addToWishlist: function () {
        $(document).on('click', '.add-to-wish-list', function (e) {
            e.preventDefault();
            var url = $(this).data('href');
            var pid = $(this)
                .closest('.product-detail')
                .find('.product-id')
                .html();
            var optionId = $(this)
                .closest('.product-detail')
                .find('.product-option')
                .attr('data-option-id');
            var optionVal = $(this)
                .closest('.product-detail')
                .find('.options-select option:selected')
                .attr('data-value-id');
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
                    if (data.loginShow === true) {
                        $('.loginPopup').find('.modal').modal('show');
                    } else {
                        $('.loginPopup')
                            .find('#exampleModalLong')
                            .modal('hide');
                    }
                    if (data.success) {
                        $('.add-to-wish-list').addClass('added');
                    } else {
                        $('.add-to-wish-list').removeClass('added');
                    }
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    addToCartFromWishlist: function () {
        $('body').on('click', '.add-to-cart', function () {
            var pid;
            var addToCartUrl;
            var pidsQty;

            $('body').trigger('product:beforeAddToCart', this);

            pid = $(this).data('pid');
            addToCartUrl = $(this).data('url');
            pidsQty = parseInt(
                $(this).closest('.product-info').find('.quantity').val(),
                10
            );

            var form = {
                pid: pid,
                quantity: pidsQty
            };

            if ($(this).data('option')) {
                form.options = JSON.stringify($(this).data('option'));
            }

            $(this).trigger('updateAddToCartFormData', form);
            if (addToCartUrl) {
                $.ajax({
                    url: addToCartUrl,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                        handlePostCartAdd(data);
                        $('body').trigger('product:afterAddToCart', data);
                        $.spinner().stop();
                        base.miniCartReportingUrl(
                            data.reportingURL,
                            data.error
                        );
                    },
                    error: function (err) {
                        $('.add-to-cart-error').text(
                            err.responseJSON.errorMessage
                        );
                        $.spinner().stop();
                    }
                });
            }
        });
    }
};
