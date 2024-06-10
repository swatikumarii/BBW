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
                        printArea.onload = function () {
                            printArea.print();
                        };
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
                    var addToCartSnackbar = $('#add-order-to-cart-snackbar');
                    if (data.isGiftCardLineItemExist) {
                        $('#delete-gift-certificate-line-item-modal').modal(
                            'show'
                        );
                        $(thisData).spinner().stop();
                        return true;
                    }
                    if (!data.error) {
                        window.location.href = data.redirectUrl;
                        addToCartSnackbar.addClass('show');
                        setTimeout(function () {
                            addToCartSnackbar.removeClass('show');
                        }, 3000);
    
                        $(thisData).spinner().stop();
                        return true;
                    } 
                    addToCartSnackbar.text(data.message);
                    addToCartSnackbar.addClass('error');
                    addToCartSnackbar.addClass('show');
                    setTimeout(function () {
                        addToCartSnackbar.removeClass('show');
                        addToCartSnackbar.removeClass('error');
                    }, 3000);

                    $(thisData).spinner().stop();
                    return true;
                },
                error: function () {
                    $(thisData).spinner().stop();
                }
            });
        }
    });

    $('.order-base-delete-egiftitem-confirmation-btn').on('click', function () {
        // var thisData = this;
        $(this).spinner().start();
        var removeGiftPliUrl = $(this).data('action');
        var addToCartUrl = $(this).data('addtocarturl');
        var form = {
            orderNumber: $(this).data('oid')
        };
        $.ajax({
            type: 'GET',
            url: removeGiftPliUrl,
            success: function () {
                $.ajax({
                    type: 'POST',
                    url: addToCartUrl,
                    data: form,
                    success: function (result) {
                        window.location.href = result.redirectUrl;

                        var addToCartSnackbar = $('#add-order-to-cart-snackbar');
                        addToCartSnackbar.addClass('show');
                        setTimeout(function () {
                            addToCartSnackbar.removeClass('show');
                        }, 3000);

                        $(this).spinner().stop();

                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        });
    });
};
