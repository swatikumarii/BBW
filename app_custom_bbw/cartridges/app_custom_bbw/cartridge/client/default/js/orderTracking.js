'use strict';

/**
 * @param {string} orderNumber - Order number
 * @param {string} orderEmail - Email address
 * @param {string} billingZipCode - Shipping zip code
 * @returns {boolean} - True is valid else false
 */
function validate(orderNumber, orderEmail, billingZipCode) {
    var isValid = true;
    if (!orderNumber) {
        $('#orderNumber-error').html($('#orderNumber').data('required'));
        isValid = false;
    }
    if (!orderEmail) {
        $('#orderEmail-error').html($('#orderEmail').data('required'));
        isValid = false;
    }
    if (!billingZipCode) {
        $('#billingZipCode-error').html($('#billingZipCode').data('required'));
        isValid = false;
    }
    return isValid;
}

/**
 * check status
 */
function checkStatus() {
    var orderNumber = $('#orderNumber').val();
    var orderEmail = $('#orderEmail').val();
    var billingZipCode = $('#billingZipCode').val();
    if (validate(orderNumber, orderEmail, billingZipCode)) {
        var actionUrl = $('#checkStatus').data('actionurl');
        var form = {
            orderNumber: orderNumber,
            orderEmail: orderEmail,
            billingZipCode: billingZipCode
        };
        if (actionUrl) {
            $.ajax({
                url: actionUrl,
                method: 'POST',
                data: form,
                success: function (data) {
                    window.location.href = data.redirectUrl;
                },
                error: function (err) {
                    // TODO: Need to change
                    if (err.responseJSON.redirectUrl) {
                        $('#orderNumber-error').html(
                            $('#orderNumber').data('required')
                        );
                    }
                }
            });
        }
    }
}

/**
 * On ready
 */
$(document).ready(function () {

    $(document).on('click', '#checkStatus', function () {
        checkStatus();
    });

});
