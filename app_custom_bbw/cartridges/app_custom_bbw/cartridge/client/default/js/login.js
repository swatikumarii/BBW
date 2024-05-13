'use strict';

var processInclude = require('base/util');
var intlTelInput = require('intl-tel-input');
var utils = require('utils.js');

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
function validateLengthField(inputField) {
    // Get the dynamic minlength and maxlength values
    var minLength = parseInt(inputField.attr('minlength'), 10); // Specify radix 10
    var maxLength = parseInt(inputField.attr('maxlength'), 10); // Specify radix 10

    // Construct the regular expression
    var regex = new RegExp('^$|^[a-zA-Z0-9\']{' + minLength + ',' + maxLength + '}$');
    if (inputField.val() && !regex.test(inputField.val())) {
        inputField.addClass('is-invalid border-danger'); // Add classes for input border error
        $('#' + inputField.attr('id') + '-error').text(inputField.data('rangeError')); // Display error message
        return false;
    }
    inputField.removeClass('is-invalid border-danger'); // Remove classes if input is valid
    $('#' + inputField.attr('id') + '-error').empty(); // Clear error message
    return true;
}
/**
 * Generic validation function for required fields
 * @param {object} inputField input field on which validation will be tested
 * @returns {boolean} valid or not
 */
function validateRequiredField(inputField) {
    if (!inputField.val()) {
        inputField.addClass('is-invalid border-danger'); // Add classes for input border error
        $('#' + inputField.attr('id') + '-error').text('Field is required'); // Display error message
        return false;
    }
    inputField.removeClass('is-invalid border-danger'); // Remove classes if input is valid
    $('#' + inputField.attr('id') + '-error').empty(); // Clear error message
    return true;
}

/**
 * Generic validation function for email fields
 * @param {object} emailInput input field on which validation will be tested
 * @returns {boolean} valid or not
 */
function validateEmailField(emailInput) {
    var pattern = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
    if (!validateRequiredField(emailInput)) return false;
    if (!pattern.test(emailInput.val())) {
        emailInput.addClass('is-invalid border-danger'); // Add class for input border error
        $('#' + emailInput.attr('id') + '-error').text('Invalid email format'); // Display error message
        return false;
    }
    emailInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#' + emailInput.attr('id') + '-error').empty(); // Clear error message
    return true;
}

/**
 * Generic validation function for password fields
 * @param {object} passwordInput input field on which validation will be tested
 * @returns {boolean} valid or not
 */
function validatePasswordField(passwordInput) {
    if (!validateRequiredField(passwordInput)) return false;
    return true;
}
/**
 * toggle password visibility
 * @param {object} passwordInput password input field
 * @param {object} showButton show button
 */
function togglePasswordVisibility(passwordInput, showButton) {
    var type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
    passwordInput.attr('type', type);
    showButton.find('.show').text(type === 'password' ? 'Show' : 'Hide');
}

$(document).ready(function () {
    processInclude(require('./login/login'));
    var phone = document.querySelector('#registration-form-phone');
    intlTelInput(phone, {
        utilsScript: utils,
        showFlags: true,
        showSelectedDialCode: true,
        initialCountry: 'au',
        countryOrder: ['au']
    });

    // Event delegation for toggling password visibility
    $(document.body).on('click', '.register-form-hide', function () {
        togglePasswordVisibility($('#registration-form-password'), $(this));
    });

    $(document.body).on(
        'click',
        '.register-form-confirm-password',
        function () {
            togglePasswordVisibility(
                $('#registration-form-password-confirm'),
                $(this)
            );
        }
    );

    // Define an array of validation fields with selector and validation function
    var validationFields = [
        {
            selector: '#registration-form-salutation',
            validationFunction: validateRequiredField
        },
        {
            selector: '#registration-form-fname',
            validationFunction: validateRequiredField
        },
        {
            selector: '#registration-form-lname',
            validationFunction: validateRequiredField
        },
        {
            selector: '#registration-form-phone',
            validationFunction: validateRequiredField
        },
        {
            selector: '#registration-form-email',
            validationFunction: validateEmailField
        },
        {
            selector: '#registration-form-email-confirm',
            validationFunction: validateEmailField
        },
        {
            selector: '#registration-form-password',
            validationFunction: validatePasswordField
        },
        {
            selector: '#registration-form-password-confirm',
            validationFunction: validatePasswordField
        },
        {
            selector: '#registration-form-gender',
            validationFunction: validateRequiredField
        },
        {
            selector: '#registration-form-zip',
            validationFunction: validateLengthField
        },
        {
            selector: '#registration-form-nationality',
            validationFunction: validateRequiredField
        },
        {
            selector: '#add-to-email-list',
            validationFunction: validateRequiredField
        },
        {
            selector: '#registration-form-dob',
            validationFunction: validateRequiredField
        },
    ];

    // Loop through the array and attach blur event handlers dynamically
    validationFields.forEach(function (field) {
        $(document).on('blur', field.selector, function () {
            validateField(field.selector, field.validationFunction);
        });
    });

    $('body').on('click', 'form.registration button', function () {
        var form = $(this).closest('form');
        setTimeout(function() {
            var element = form.find(
                '.form-control.is-invalid, .selectric-form-control.is-invalid'
            );
            if (element && element.length) {
                $('body,html').animate(
                    {
                        scrollTop: element.offset().top - 250
                    },
                    500
                );
            }
        }, 100);
    });
});
