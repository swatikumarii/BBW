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

    // Toggle password visibility for login form
    var loginPasswordInput = $('#login-form-password');
    var loginShowButton = $('.login-modal-hide');
    loginShowButton.on('click', function () {
        togglePasswordVisibility(loginPasswordInput, loginShowButton);
    });

    // Toggle password visibility for registration form password
    var registrationPasswordInput = $('#registration-form-password');
    var registrationShowButton = $('.register-form-hide');
    registrationShowButton.on('click', function () {
        togglePasswordVisibility(registrationPasswordInput, registrationShowButton);
    });

    // Toggle confirm password visibility for registration form confirm password
    var confirmPasswordInput = $('#registration-form-password-confirm');
    var confirmPasswordShowButton = $('.register-form-confirm-password');
    confirmPasswordShowButton.on('click', function () {
        togglePasswordVisibility(confirmPasswordInput, confirmPasswordShowButton);
    });

    // Define an array of selectors and corresponding validation functions
    var validationFields = [
        { selector: '#registration-form-salutation', validationFunction: validateSalutation },
        { selector: '#registration-form-fname', validationFunction: validateFirstName },
        { selector: '#registration-form-lname', validationFunction: validateLastName },
        { selector: '#registration-form-phone', validationFunction: validatePhoneNumber },
        { selector: '#registration-form-email', validationFunction: validateEmail },
        { selector: '#registration-form-email-confirm', validationFunction: validateConfirmEmail },
        { selector: '#registration-form-password', validationFunction: validatePassword },
        { selector: '#registration-form-password', validationFunction: validateConfirmPassword },
        { selector: '#registration-form-gender', validationFunction: validateGender },
        { selector: '#registration-form-zip', validationFunction: validateZipCode },
        { selector: '#registration-form-nationality', validationFunction: validateNationality },
        { selector: '#add-to-email-list', validationFunction: validateEmailListCheckbox },
        { selector: '#registration-form-dob', validationFunction: validateDOB },
        { selector: '#login-form-email', validationFunction: validateLoginEmail },
        { selector: '#login-form-password', validationFunction: validateLoginPassword },
        { selector: '#reset-password-email', validationFunction: validateRequestEmail }
    ];

    // Loop through the array and attach blur event handlers dynamically
    validationFields.forEach(field => {
        $(document).on('blur', field.selector, function () {
            validateField(field.selector, field.validationFunction);
        });
    });

    // Reusable function to validate a field based on its ID
    function validateField(selector, validationFunction) {
        validationFunction();
    }
});

// -------Register form----------
/**
 * @returns {boolean} True is valid else False
 */
function validateSalutation() {
    var selectSalutation = $('#registration-form-salutation');
    if (!selectSalutation.val()) {
        selectSalutation.addClass('is-invalid border-danger'); // Add classes for input border error
        $('#salutation-error').text('Salutation is required'); // Display error message
        return false;
    }
    selectSalutation.removeClass('is-invalid border-danger'); // Remove classes if input is valid
    $('#salutation-error').empty(); // Clear error message
    return true;
}

function validateFirstName() {
    var firstNameInput = $('#registration-form-fname');
    if (!firstNameInput.val()) {
        firstNameInput.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    firstNameInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#fname-error').empty();
    return true;
}


function validateLastName() {
    var lastNameInput = $('#registration-form-lname');
    if (!lastNameInput.val()) {
        lastNameInput.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    lastNameInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#lname-error').empty();
    return true;
}

function validatePhoneNumber() {
    var phoneInput = $('#registration-form-phone');
    if (!phoneInput.val()) {
        phoneInput.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    phoneInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#phone-error').empty();
    return true;
}

function validateEmail() {
    var emailInput = $('#registration-form-email');
    if (!emailInput.val()) {
        emailInput.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    emailInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#email-error').empty();
    return true;
}

function validateConfirmEmail() {
    var confirmEmailInput = $('#registration-form-email-confirm');
    if (!confirmEmailInput.val()) {
        confirmEmailInput.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    confirmEmailInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#confirm-email-error').empty();
    return true;
}

function validatePassword() {
    var passwordInput = $('#registration-form-password');
    if (!passwordInput.val()) {
        passwordInput.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    passwordInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#password-error').empty();
    return true;
}

function validateConfirmPassword() {
    var confirmPasswordInput = $('#registration-form-password-confirm');
    if (!confirmPasswordInput.val()) {
        confirmPasswordInput.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    confirmPasswordInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#confirm-password-error').empty();
    return true;
}

function validateGender() {
    var genderInput = $('#registration-form-gender');
    if (!genderInput.val()) {
        genderInput.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    genderInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#gender-error').empty();
    return true;
}

function validateZipCode() {
    var zipCodeInput = $('#registration-form-zip');
    if (!zipCodeInput.val()) {
        zipCodeInput.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    zipCodeInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#zip-code-error').empty();
    return true;
}

function validateNationality() {
    var nationalityInput = $('#registration-form-nationality');
    if (!nationalityInput.val()) {
        nationalityInput.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    nationalityInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#nationality-error').empty();
    return true;
}

function validateEmailListCheckbox() {
    var emailListCheckbox = $('#add-to-email-list');
    if (!emailListCheckbox.val()) {
        emailListCheckbox.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    emailListCheckbox.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#data-missing-error').empty();
    return true;
}

function validateDOB() {
    var dobInput = $('#registration-form-dob');
    if (!dobInput.val()) {
        dobInput.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    dobInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#dob-error').empty();
    return true;
}

// ---------login form---------
function validateLoginEmail() {
    var emailInput = $('#login-form-email');
    var pattern = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
    if (!emailInput.val()) {
        emailInput.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    if (!pattern.test(emailInput.val())) {
        emailInput.addClass('is-invalid border-danger'); // Add class for input border error
        $('#login-email-error').html(emailInput.data('invalidemail'));
        return false;
    }
    emailInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#login-email-error').empty();
    return true;
}

function validateLoginPassword() {
    var passwordInput = $('#login-form-password'); 
    if (!passwordInput.val()) {
        passwordInput.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    passwordInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#login-password-error').empty();
    return true;
}


// ------Forgot password-----
function validateRequestEmail() {
    var emailInput = $('#reset-password-email');
    var pattern = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
    if (!emailInput.val()) {
        emailInput.addClass('is-invalid border-danger'); // Add class for input border error
        return false;
    }
    if (!pattern.test(emailInput.val())) {
        emailInput.addClass('is-invalid border-danger'); // Add class for input border error
        $('#resetEmail').html(emailInput.data('invalidemail'));
        return false;
    }
    emailInput.removeClass('is-invalid border-danger'); // Remove class if input is valid
    $('#resetEmail').empty();
    return true;
}
