'use strict';

module.exports = function () {

    // Download invoice from order listing page
    $(document).on('click', '#invoiceDownload', function () {
        var invoiceUrl = $(this).data('action');
        $.ajax({
            url: invoiceUrl,
            method: 'GET',
            success: function (data) {
                if (data) {
                    var printDiv = data;
                    var printArea = window.open('', '', 'height=1000, width=1000');
                    if (printArea) {
                        printArea.document.write(printDiv);
                        printArea.document.close();
                        printArea.onload = function () {
                            printArea.print();
                        };
                    }
                }
            }
        });
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
                    $(thisData).spinner().stop();
                },
                error: function () {
                    $(thisData).spinner().stop();
                }
            });
        }
    });
};
