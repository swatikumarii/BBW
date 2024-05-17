'use strict';

module.exports = function () {

    // Download invoice from order listing page
    $(document).on('click', '#invoiceDownload', function () {
        var invoiceUrl = $(this).data('action');
        var thisData = this;
        $(thisData).spinner().start();
        var printArea = window.open('', '', 'height=1000, width=1000');

        if (printArea) {
            $.ajax({
                url: invoiceUrl,
                method: 'GET',
                success: function (data) {
                    if (data) {
                        $(thisData).spinner().stop();
                        printArea.document.write(data);
                        printArea.document.close();
                        setTimeout(function () {
                            printArea.print();
                            printArea.close();
                        }, 60000);
                    }
                    $(thisData).spinner().stop();
                },
                error: function () {
                    printArea.close();
                    $(thisData).spinner().stop();
                }
            });
        }
    });

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

                    var addToCartSnackbar = $('#add-order-to-cart-snackbar');
                    addToCartSnackbar.addClass('show');
                    setTimeout(function () {
                        addToCartSnackbar.removeClass('show');
                    }, 3000);

                    $(thisData).spinner().stop();
                },
                error: function () {
                    $(thisData).spinner().stop();
                }
            });
        }
    });
};
