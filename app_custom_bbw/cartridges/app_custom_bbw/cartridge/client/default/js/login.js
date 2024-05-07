'use strict';

var processInclude = require('base/util');
var intlTelInput = require('intl-tel-input');
var utils = require('utils.js');

$(document).ready(function () {
    processInclude(require('./login/login'));
    var phone = document.querySelector('#registration-form-phone');
    intlTelInput(phone, {
        utilsScript: utils,
        showFlags: true,
        showSelectedDialCode: true,
        initialCountry: 'au',
    });
});
// confirm login modal page
$(document).ready(function () {
    function togglePasswordVisibility(passwordInput, showButton) {
        var type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
        passwordInput.attr('type', type);
        showButton.find('.show').text(type === 'password' ? 'Show' : 'Hide');
    }

    // Event delegation for toggling password visibility
    $(document.body).on('click', '.login-modal-hide', function () {
        togglePasswordVisibility($('#login-form-password'), $(this));
    });

    $(document.body).on('click', '.register-form-hide', function () {
        togglePasswordVisibility($('#registration-form-password'), $(this));
    });

    $(document.body).on('click', '.register-form-confirm-password', function () {
        togglePasswordVisibility($('#registration-form-password-confirm'), $(this));
    });


    // Define an array of validation fields with selector and validation function
    var validationFields = [
        { selector: '#registration-form-salutation', validationFunction: validateRequiredField },
        { selector: '#registration-form-fname', validationFunction: validateRequiredField },
        { selector: '#registration-form-lname', validationFunction: validateRequiredField },
        { selector: '#registration-form-phone', validationFunction: validateRequiredField },
        { selector: '#registration-form-email', validationFunction: validateEmailField },
        { selector: '#registration-form-email-confirm', validationFunction: validateEmailField },
        { selector: '#registration-form-password', validationFunction: validatePasswordField },
        { selector: '#registration-form-password-confirm', validationFunction: validatePasswordField },
        { selector: '#registration-form-gender', validationFunction: validateRequiredField },
        { selector: '#registration-form-zip', validationFunction: validateRequiredField },
        { selector: '#registration-form-nationality', validationFunction: validateRequiredField },
        { selector: '#add-to-email-list', validationFunction: validateRequiredField },
        { selector: '#registration-form-dob', validationFunction: validateRequiredField },
        { selector: '#login-form-email', validationFunction: validateEmailField },
        { selector: '#login-form-password', validationFunction: validatePasswordField },
        { selector: '#reset-password-email', validationFunction: validateEmailField }
    ];

    // Loop through the array and attach blur event handlers dynamically
    validationFields.forEach(field => {
        $(document).on('blur', field.selector, function () {
            validateField(field.selector, field.validationFunction);
        });
    });

    // Reusable function to validate a field based on its ID
    function validateField(selector, validationFunction) {
        validationFunction($(selector));
    }

    // Generic validation function for required fields
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

    // Generic validation function for email fields
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

    // Generic validation function for password fields
    function validatePasswordField(passwordInput) {
        if (!validateRequiredField(passwordInput)) return false;
        return true;
    }
})
