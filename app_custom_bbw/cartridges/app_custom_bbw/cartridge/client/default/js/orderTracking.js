'use strict';

/**
 * @returns {boolean} True if valid else False
 */
function validateOrderNumber() {
    var orderNumberInput = $('#orderNumber');
    if (!orderNumberInput.val()) {
        $('#orderNumber-error').html(orderNumberInput.data('required'));
        return false;
    }
    $('#orderNumber-error').empty();
    return true;
}

/**
 * @returns {boolean} True if valid else False
 */
function validateEmail() {
    var emailInput = $('#orderEmail');
    var pattern = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
    if (!emailInput.val()) {
        $('#orderEmail-error').html(emailInput.data('required'));
        return false;
    }
    if (!pattern.test(emailInput.val())) {
        $('#orderEmail-error').html(emailInput.data('invalidemail'));
        return false;
    }
    $('#orderEmail-error').empty();
    return true;
}

/**
 * @returns {boolean} True if valid else False
 */
function validateBillingZipCode() {
    var billingZipCodeInput = $('#billingZipCode');
    if (!billingZipCodeInput.val()) {
        $('#billingZipCode-error').html(billingZipCodeInput.data('required'));
        return false;
    }
    if (billingZipCodeInput.val().length > 10) {
        $('#billingZipCode-error').html(billingZipCodeInput.data('maxlength'));
        return false;
    }
    $('#billingZipCode-error').empty();
    return true;
}

/**
 * @returns {boolean} True if valid else False
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
    if (validateCheckStatus()) {
        var actionUrl = $('#checkStatus').data('actionurl');
        var form = {
            orderNumber: $('#orderNumber').val(),
            orderEmail: $('#orderEmail').val(),
            billingZipCode: $('#billingZipCode').val()
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
                        for (var i = 0; i < err.responseJSON.fieldErrors.length; i++) {
                            var fieldError = err.responseJSON.fieldErrors[i];
                            $('#' + fieldError.key + '-error').html(fieldError.message);
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

// ---validation on blur----
$(document).ready(function () {
    var form = $('#myForm');

    // Validate input fields on blur event
    form.on('blur', 'input', function () {
        if (!$(this).prop('checkValidity')) return;

        if (!this.checkValidity()) {
            $(this).addClass('is-invalid');
        } else {
            $(this).removeClass('is-invalid');
        }
    });

    // Prevent form submission if it's invalid
    form.on('submit', function (event) {
        if (!form[0].checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.addClass('was-validated');
    });
});
