'use strict';

/**
 * @returns {boolean} True is valid else False
 */
function validateOrderNumber() {
    if (!$('#orderNumber').val()) {
        $('#orderNumber-error').html($('#orderNumber').data('required'));
        return false;
    }
    $('#orderNumber-error').empty();
    return true;
}

/**
 * @returns {boolean} True is valid else False
 */
function validateEmail() {
    var pattern = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
    if (!$('#orderEmail').val()) {
        $('#orderEmail-error').html($('#orderEmail').data('required'));
        return false;
    } if (!pattern.test($('#orderEmail').val())) {
        $('#orderEmail-error').html($('#orderEmail').data('invalidemail'));
        return false;
    }
    $('#orderEmail-error').empty();
    return true;
}

/**
 * @returns {boolean} True is valid else False
 */
function validateBillingZipCode() {
    if (!$('#billingZipCode').val()) {
        $('#billingZipCode-error').html($('#billingZipCode').data('required'));
        return false;
    } if ($('#billingZipCode').val().length > 10) {
        $('#billingZipCode-error').html($('#billingZipCode').data('maxlength'));
        return false;
    }
    $('#billingZipCode-error').empty();
    return true;
}

/**
 * @returns {boolean} - True is valid else false
 */
function validateCheckStatus() {
    var isValid = true;
    if (!validateOrderNumber()) {
        isValid = false;
    }
    if (!validateEmail()) {
        isValid = false;
    }
    if (!validateBillingZipCode()) {
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
    if (validateCheckStatus()) {
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
                    $('.error-class').empty();
                    if (err.responseJSON.fieldErrors) {
                        for (
                            var i = 0;
                            i < err.responseJSON.fieldErrors.length;
                            i++
                        ) {
                            var fieldError = err.responseJSON.fieldErrors[i];
                            $('#' + fieldError.key + '-error').html(
                                fieldError.message
                            );
                        }
                    } else {
                        $('#form-error').html(err.responseJSON.message);
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

    $(document).on('focusout', '#orderNumber', function () {
        validateOrderNumber();
    });

    $(document).on('focusout', '#orderEmail', function () {
        validateEmail();
    });

    $(document).on('focusout', '#billingZipCode', function () {
        validateBillingZipCode();
    });

});
