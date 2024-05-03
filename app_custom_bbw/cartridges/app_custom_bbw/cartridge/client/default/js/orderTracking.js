'use strict';

/**
 * @returns {boolean} True is valid else False
 */
function validateOrderNumber() {
    var orderNumberInput = $('#orderNumber');
    if (!orderNumberInput.val()) {
        orderNumberInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    orderNumberInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#orderNumber-error').empty();
    return true;
}

/**
 * @returns {boolean} True is valid else False
 */
function validateEmail() {
    var emailInput = $('#orderEmail');
    var pattern = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
    if (!emailInput.val()) {
        emailInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    if (!pattern.test(emailInput.val())) {
        emailInput.addClass('is-invalid'); // Add class for input border error
        $('#orderEmail-error').html(emailInput.data('invalidemail'));
        return false;
    }
    emailInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#orderEmail-error').empty();
    return true;
}

/**
 * @returns {boolean} True is valid else False
 */
function validateBillingZipCode() {
    var billingZipCodeInput = $('#billingZipCode');
    if (!billingZipCodeInput.val()) {
        billingZipCodeInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    if (billingZipCodeInput.val().length > 10) {
        billingZipCodeInput.addClass('is-invalid'); // Add class for input border error
        $('#billingZipCode-error').html(billingZipCodeInput.data('maxlength'));
        return false;
    }
    billingZipCodeInput.removeClass('is-invalid'); // Remove class if input is valid
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
                        // Scroll to the first error position
                        var firstErrorPosition = $('.is-invalid').first().offset().top;
                        $('html, body').animate({
                            scrollTop: firstErrorPosition
                        }, 'slow');
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

    $(document).on('blur', '#orderNumber', function () {
        validateOrderNumber();
    });

    $(document).on('blur', '#orderEmail', function () {
        validateEmail();
    });

    $(document).on('blur', '#billingZipCode', function () {
        validateBillingZipCode();
    });

});
