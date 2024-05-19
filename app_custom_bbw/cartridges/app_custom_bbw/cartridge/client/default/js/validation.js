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
     * Generic validation function for password fields
     * @param {object} passwordInput input field on which validation will be tested
     * @returns {boolean} valid or not
     */
    function validatePasswordFieldWithValidation(passwordInput) {
        if (!validateRequiredField(passwordInput)) return false;

        // Remove existing success messages and ticks
        passwordInput.closest('.form-group').find('.text-success').remove();
        passwordInput.closest('.form-group').find('.far').remove();

        // Check for each requirement and display a green tick with success message
        var rules = [
            { name: 'rule8to50char', pattern: /^.{8,50}$/ },
            { name: 'rule1lowercase', pattern: /[a-z]/ },
            { name: 'rule1uppercase', pattern: /[A-Z]/ },
            { name: 'rule1number', pattern: /\d/ },
            { name: 'ruleNoSpaces', pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$/ },
            { name: 'ruleSpecialChar', pattern: /[@$!%*?&]/ }
        ];

        rules.forEach(function (rule) {
            if (rule.pattern.test(passwordInput.val())) {
                $('#' + rule.name).removeClass('error').addClass('success');
            } else {
                $('#' + rule.name).removeClass('success').addClass('error');
            }
        });

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
            if(input.parents('.iti').length ) input.parents('.iti').addClass('is-invalid border-danger');
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
     * @param {object} inputField input field on which validation will be tested
     * @returns {boolean} valid or not
     */
    function validZipCode(inputField) {
        // Get the dynamic minlength and maxlength values
        var minLength = parseInt(inputField.attr('minlength'), 10); // Specify radix 10
        var maxLength = parseInt(inputField.attr('maxlength'), 10); // Specify radix 10

        // Construct the regular expression
        var regex = new RegExp('^[0-9]{' + minLength + ',' + maxLength + '}$');
        if (inputField.val() && !regex.test(inputField.val())) {
            inputField.addClass('is-invalid border-danger'); // Add classes for input border error
            var errorMessage = $('#' + inputField.attr('id')).attr(
                'data-pattern-mismatch'
            );
            $('#' + inputField.attr('id'))
                .closest('.form-group')
                .find('.invalid-feedback')
                .text(errorMessage);
            return false;
        }
        inputField.removeClass('is-invalid border-danger'); // Remove classes if input is valid
        $('#' + inputField.attr('id') + '-error').empty(); // Clear error message
        return true;
    }

    /**
     * Generic validation function for zip code
     * @param {object} input input field on which validation will be tested
     * @returns {boolean} valid or not
     */
    function validZipCodeRequired(input) {
        // Get the dynamic minlength and maxlength values
        var minLength = parseInt(input.attr('minlength'), 10); // Specify radix 10
        var maxLength = parseInt(input.attr('maxlength'), 10); // Specify radix 10

        // Construct the regular expression
        var pattern = new RegExp(
            '^[0-9]{' + minLength + ',' + maxLength + '}$'
        );
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
        { selector: '#newPassword', validationFunction: validatePasswordFieldWithValidation },
        { selector: '#firstName', validationFunction: validMinLength },
        { selector: '#lastName', validationFunction: validMinLength },
        { selector: '#phone', validationFunction: validPhoneNumber },
        { selector: '#zip', validationFunction: validZipCodeRequired },
        { selector: '#password', validationFunction: validatePasswordField },
        { selector: '#addressId', validationFunction: validateRequiredField },
        { selector: '#address1', validationFunction: validateRequiredField },
        { selector: '#city', validationFunction: validateRequiredField },
        { selector: '#state', validationFunction: validateRequiredField },
        { selector: '#zipCode', validationFunction: validZipCode },
        { selector: '#phone', validationFunction: validPhoneNumber }
    ];

    /**
     * Add a function to check if the form is valid
     */
    function editProfileFormValidity() {
        var isFormValid = true;
        var editProfileForm = $('form.edit-profile-form');
        validationFields.forEach(function (field) {
            var inputField = $(field.selector);
            if (
                editProfileForm.is(inputField.closest('form')) &&
                !field.validationFunction(inputField)
            ) {
                isFormValid = false;
            }
        });
        var submitButtons = $('button[type="submit"].submit-edit-profile');
        if (isFormValid && editProfileForm.get(0).checkValidity()) {
            submitButtons.removeClass('disabled');
        } else {
            submitButtons.addClass('disabled');
        }
    }

    // Loop through the array and attach blur event handlers dynamically
    validationFields.forEach(function (field) {
        if (field.selector === '#newPassword') {
            $(document).on('keyup', field.selector, function () {
                validateField(field.selector, field.validationFunction);
            });
        }
        $(document).on('blur', field.selector, function () {
            validateField(field.selector, field.validationFunction);
            var form = $(this).closest('form.edit-profile-form');
            if (form.length > 0) {
                editProfileFormValidity();
            }
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

$('#newPassword').click(function () {
    $('.required-pass').removeClass('d-none');
});

$('body').click(function (event) {
    // Check if the clicked element is not inside the #newPassword element
    if (!$(event.target).closest('#newPassword').length) {
        $('.required-pass').addClass('d-none');
    }

    var form = $(this).closest('form.edit-profile-form');
    if (!$(event.target).closest(form).length) {
        var submitButton = $('button[type="submit"].submit-edit-profile');
        var field = $('#password');
        if (field.val() === '') {
            submitButton.addClass('disabled');
        }
    }
});
