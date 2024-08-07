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
    return true;
}

/**
 * @returns {boolean} True is valid else False
 */
function validateEmail() {
    var emailInput = $('#orderEmail');
    var pattern = /^[\w.%+-]+@[\w.-]+\.\w{2,}$/i;
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
                    if (data.error) {
                        $('.error-class').empty();
                        if (data.fieldErrors) {
                            for (
                                var i = 0;
                                i < data.fieldErrors.length;
                                i++
                            ) {
                                var fieldError =
                                    data.fieldErrors[i];
                                $('#' + fieldError.key + '-error').html(
                                    fieldError.message
                                );
                            }
                            // Scroll to the first error position if the page is not already at the top
                            var firstErrorPosition = $('.is-invalid')
                                .first()
                                .offset().top;
                            if ($(window).scrollTop() > 0) {
                                $('html, body').animate(
                                    {
                                        scrollTop: firstErrorPosition - 500 // Adjusted to scroll up 300 pixels above the error position
                                    },
                                    500
                                ); // Reduced duration to make scrolling faster (500 milliseconds)
                            }
                        } else {
                            $('#form-error').html(data.message);
                            $('.form-error-div').removeClass('d-none');
                        }
                    } else {
                        window.location.href = data.redirectUrl;
                    }
                }
            });
        }
    } else {
        // Scroll to the first error position if errors are found and the page is not already at the top
        var firstErrorPosition = $('.is-invalid').first().offset().top;
        if ($(window).scrollTop() > 0) {
            $('html, body').animate({
                scrollTop: (firstErrorPosition - 500) // Adjusted to scroll up 300 pixels above the error position
            }, 500); // Reduced duration to make scrolling faster (500 milliseconds)
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
