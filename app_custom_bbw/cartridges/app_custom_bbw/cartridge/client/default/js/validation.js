'use strict';

/**
 * Showing the content for show more functionality
 */
$(document).ready(function () {
    /**
     * Reusable function to validate a field based on its ID
     * @param {object} selector selector on which validation function runs
     * @param {Function} validationFunction validation function
     */
    function validateField(selector, validationFunction) {
        validationFunction($(selector));
    }

    /**
     * Generic validation function for required fields
     * @param {object} inputField input field on which validation will be tested
     * @returns {boolean} valid or not
     */
    function validateRequiredField(inputField) {
        if (!inputField.val()) {
            inputField.addClass('is-invalid border-danger'); // Add classes for input border error
            var errorMessage = $('#' + inputField.attr('id')).attr(
                'data-missing-error'
            );
            $('#' + inputField.attr('id'))
                .closest('.form-group')
                .find('.invalid-feedback')
                .text(errorMessage);
            // $('#' + inputField.attr('id') + '-error').text('Field is required'); // Display error message
            return false;
        }
        inputField.removeClass('is-invalid border-danger'); // Remove classes if input is valid
        $('#' + inputField.attr('id') + '-error').empty(); // Clear error message
        return true;
    }

    /**
     * Generic validation function for password fields
     * @param {object} passwordInput input field on which validation will be tested
     * @returns {boolean} valid or not
     */
    function validatePasswordField(passwordInput) {
        var pattern =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$/;
        if (!validateRequiredField(passwordInput)) return false;
        if (!pattern.test(passwordInput.val())) {
            passwordInput.addClass('is-invalid border-danger'); // Add class for input border error
            var errorMessage = $('#' + passwordInput.attr('id')).attr(
                'data-pattern-mismatch'
            );
            $('#' + passwordInput.attr('id'))
                .closest('.form-group')
                .find('.invalid-feedback')
                .text(errorMessage);
            return false;
        }
        passwordInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
        $('#' + passwordInput.attr('id') + '-error').empty(); // Clear error message
        return true;
    }

    /**
     * Generic validation function for first name and last name
     * @param {object} input input field on which validation will be tested
     * @returns {boolean} valid or not
     */
    function validMinLength(input) {
        var pattern = /^[a-zA-Z0-9' -]{2,50}$/;
        if (!validateRequiredField(input)) return false;
        if (!pattern.test(input.val())) {
            input.addClass('is-invalid border-danger'); // Add class for input border error
            var errorMessage =
                input.val().length === 1
                    ? $('#' + input.attr('id')).attr('data-range-error')
                    : $('#' + input.attr('id')).attr('data-pattern-mismatch');
            $('#' + input.attr('id'))
                .closest('.form-group')
                .find('.invalid-feedback')
                .text(errorMessage);
            return false;
        }
        input.removeClass('is-invalid border-danger'); // Remove class if input is valid
        $('#' + input.attr('id') + '-error').empty(); // Clear error message
        return true;
    }

    /**
     * Generic validation function for phone number
     * @param {object} input input field on which validation will be tested
     * @returns {boolean} valid or not
     */
    function validPhoneNumber(input) {
        var pattern = /^((?!(0))[0-9]{8,12})$/;
        if (!validateRequiredField(input)) return false;
        if (!pattern.test(input.val())) {
            input.addClass('is-invalid border-danger'); // Add class for input border error
            var errorMessage = $('#' + input.attr('id')).attr(
                'data-pattern-mismatch'
            );
            $('#' + input.attr('id'))
                .closest('.form-group')
                .find('.invalid-feedback')
                .text(errorMessage);
            return false;
        }
        input.removeClass('is-invalid border-danger'); // Remove class if input is valid
        $('#' + input.attr('id') + '-error').empty(); // Clear error message
        return true;
    }

    /**
     * Generic validation function for zip code
     * @param {object} input input field on which validation will be tested
     * @returns {boolean} valid or not
     */
    function validZipCode(input) {
        // Get the dynamic minlength and maxlength values
        var minLength = parseInt(input.attr('minlength'), 10); // Specify radix 10
        var maxLength = parseInt(input.attr('maxlength'), 10); // Specify radix 10

        // Construct the regular expression
        var pattern = new RegExp('^[0-9]{' + minLength + ',' + maxLength + '}$');
        // var pattern = /^[0-9]{4}$/;
        if (!validateRequiredField(input)) return false;
        if (!pattern.test(input.val())) {
            input.addClass('is-invalid border-danger'); // Add class for input border error
            var errorMessage = $('#' + input.attr('id')).attr(
                'data-pattern-mismatch'
            );
            $('#' + input.attr('id'))
                .closest('.form-group')
                .find('.invalid-feedback')
                .text(errorMessage);
            return false;
        }
        input.removeClass('is-invalid border-danger'); // Remove class if input is valid
        $('#' + input.attr('id') + '-error').empty(); // Clear error message
        return true;
    }

    // Define an array of validation fields with selector and validation function
    var validationFields = [
        {
            selector: '#currentPassword',
            validationFunction: validatePasswordField
        },
        { selector: '#newPassword', validationFunction: validatePasswordField },
        { selector: '#firstName', validationFunction: validMinLength },
        { selector: '#lastName', validationFunction: validMinLength },
        { selector: '#phone', validationFunction: validPhoneNumber },
        { selector: '#zip', validationFunction: validZipCode },
        { selector: '#password', validationFunction: validatePasswordField },
        { selector: '#addressId', validationFunction: validateRequiredField },
        { selector: '#address1', validationFunction: validateRequiredField },
        { selector: '#city', validationFunction: validateRequiredField },
        { selector: '#state', validationFunction: validateRequiredField },
        { selector: '#zipCode', validationFunction: validZipCode },
        { selector: '#phone', validationFunction: validPhoneNumber }
    ];

    // Loop through the array and attach blur event handlers dynamically
    validationFields.forEach(function (field) {
        $(document).on('blur', field.selector, function () {
            validateField(field.selector, field.validationFunction);
        });
    });
});

/**
 * This will check googlerecaptcha token and submit change password form
 * @param {string} token - token
 */
window.submitPassword = function (token) {
    return new Promise(function (resolve, reject) {
        if (!token) {
            reject();
        }
        if (token !== '') {
            $('.g-recaptcha').closest('form.change-password-form').submit();
            resolve();
        }
        grecaptcha.reset();
    });
};

/**
 * This will check googlerecaptcha token and submit edit profile form
 * @param {string} token - token
 */
window.submitProfile = function (token) {
    return new Promise(function (resolve, reject) {
        if (!token) {
            reject();
        }
        if (token !== '') {
            $('.g-recaptcha').closest('form.edit-profile-form').submit();
            resolve();
        }
        grecaptcha.reset();
    });
};
