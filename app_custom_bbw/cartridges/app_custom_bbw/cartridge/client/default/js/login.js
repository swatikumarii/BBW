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

    $(document).on('blur', '#registration-form-salutation', function () {
        validateSalutation();
    });

    $(document).on('blur', '#registration-form-fname', function () {
        validateFirstName();
    });

    $(document).on('blur', '#registration-form-lname', function () {
        validateLastName();
    });

    $(document).on('blur', '#registration-form-phone', function () {
        validatePhoneNumber();
    });

    $(document).on('blur', '#registration-form-email', function () {
        validateEmail();
    });

    $(document).on('blur', '#registration-form-email-confirm', function () {
        validateConfirmEmail();
    });

    $(document).on('blur', '#registration-form-password', function () {
        validatePassword();
    });

    $(document).on('blur', '#registration-form-password', function () {
        validateConfirmPassword();
    });

    $(document).on('blur', '#registration-form-gender', function () {
        validateGender();
    });

    $(document).on('blur', '#registration-form-zip', function () {
        validateZipCode();
    });

    $(document).on('blur', '#registration-form-nationality', function () {
        validateNationality();
    });

    $(document).on('blur', '#add-to-email-list', function () {
        validateEmailListCheckbox();
    });

    $(document).on('blur', '#registration-form-dob', function () {
        validateDOB();
    });

    $(document).on('blur', '#login-form-email', function () {
        validateLoginEmail();
    });

    $(document).on('blur', '#login-form-password', function () {
        validateLoginPassword();
    });

    $(document).on('blur', '#reset-password-email', function () {
        validateRequestEmail();
    });
});

// -------Register form----------
/**
 * @returns {boolean} True is valid else False
 */
function validateSalutation() {
    var selectSaturation = $('#registration-form-salutation');
    if (!selectSaturation.val()) {
        selectSaturation.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    selectSaturation.removeClass('is-invalid'); // Remove class if input is valid
    $('#salutation-error').empty();
    return true;
}

$('#registration-form-salutation').on('focusout', function () {
    validateSalutation();
    // Check if the field is empty and add a red border if it is
    if (!$(this).val()) {
        $(this).addClass('border-danger');
    } else {
        $(this).removeClass('border-danger');
    }
});

function validateFirstName() {
    var firstNameInput = $('#registration-form-fname');
    if (!firstNameInput.val()) {
        firstNameInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    firstNameInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#fname-error').empty();
    return true;
}

$('#registration-form-fname').on('focusout', function () {
    validateFirstName();
    // Check if the field is empty and add a red border if it is
    if (!$(this).val()) {
        $(this).addClass('border-danger');
    } else {
        $(this).removeClass('border-danger');
    }
});


function validateLastName() {
    var lastNameInput = $('#registration-form-lname');
    if (!lastNameInput.val()) {
        lastNameInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    lastNameInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#lname-error').empty();
    return true;
}

$('#registration-form-lname').on('focusout', function () {
    validateLastName();
    // Check if the field is empty and add a red border if it is
    if (!$(this).val()) {
        $(this).addClass('border-danger');
    } else {
        $(this).removeClass('border-danger');
    }
});

function validatePhoneNumber() {
    var phoneInput = $('#registration-form-phone');
    if (!phoneInput.val()) {
        phoneInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    phoneInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#phone-error').empty();
    return true;
}

$('#registration-form-phone').on('focusout', function () {
    validatePhoneNumber();
    // Check if the field is empty and add a red border if it is
    if (!$(this).val()) {
        $(this).addClass('border-danger');
    } else {
        $(this).removeClass('border-danger');
    }
});

function validateEmail() {
    var emailInput = $('#registration-form-email');
    if (!emailInput.val()) {
        emailInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    emailInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#email-error').empty();
    return true;
}

$('#registration-form-email').on('focusout', function () {
    validateEmail();
    // Check if the field is empty and add a red border if it is
    if (!$(this).val()) {
        $(this).addClass('border-danger');
    } else {
        $(this).removeClass('border-danger');
    }
});

function validateConfirmEmail() {
    var confirmEmailInput = $('#registration-form-email-confirm');
    if (!confirmEmailInput.val()) {
        confirmEmailInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    confirmEmailInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#confirm-email-error').empty();
    return true;
}

$('#registration-form-email-confirm').on('focusout', function () {
    validateConfirmEmail();
    // Check if the field is empty and add a red border if it is
    if (!$(this).val()) {
        $(this).addClass('border-danger');
    } else {
        $(this).removeClass('border-danger');
    }
});

function validatePassword() {
    var passwordInput = $('#registration-form-password');
    if (!passwordInput.val()) {
        passwordInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    passwordInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#password-error').empty();
    return true;
}

$('#registration-form-password').on('focusout', function () {
    validatePassword();
    // Check if the field is empty and add a red border if it is
    if (!$(this).val()) {
        $(this).addClass('border-danger');
    } else {
        $(this).removeClass('border-danger');
    }
});

function validateConfirmPassword() {
    var confirmPasswordInput = $('#registration-form-password-confirm');
    if (!confirmPasswordInput.val()) {
        confirmPasswordInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    confirmPasswordInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#confirm-password-error').empty();
    return true;
}

$('#registration-form-password-confirm').on('focusout', function () {
    validateConfirmPassword();
    // Check if the field is empty and add a red border if it is
    if (!$(this).val()) {
        $(this).addClass('border-danger');
    } else {
        $(this).removeClass('border-danger');
    }
});

function validateGender() {
    var genderInput = $('#registration-form-gender');
    if (!genderInput.val()) {
        genderInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    genderInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#gender-error').empty();
    return true;
}

$('#registration-form-gender').on('focusout', function () {
    validateGender();
    // Check if the field is empty and add a red border if it is
    if (!$(this).val()) {
        $(this).addClass('border-danger');
    } else {
        $(this).removeClass('border-danger');
    }
});

function validateZipCode() {
    var zipCodeInput = $('#registration-form-zip');
    if (!zipCodeInput.val()) {
        zipCodeInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    zipCodeInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#zip-code-error').empty();
    return true;
}

$('#registration-form-zip').on('focusout', function () {
    validateZipCode();
    // Check if the field is empty and add a red border if it is
    if (!$(this).val()) {
        $(this).addClass('border-danger');
    } else {
        $(this).removeClass('border-danger');
    }
});

function validateNationality() {
    var nationalityInput = $('#registration-form-nationality');
    if (!nationalityInput.val()) {
        nationalityInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    nationalityInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#nationality-error').empty();
    return true;
}

$('#registration-form-nationality').on('focusout', function () {
    validateNationality();
    // Check if the field is empty and add a red border if it is
    if (!$(this).val()) {
        $(this).addClass('border-danger');
    } else {
        $(this).removeClass('border-danger');
    }
});

function validateEmailListCheckbox() {
    var emailListCheckbox = $('#add-to-email-list');
    if (!emailListCheckbox.val()) {
        emailListCheckbox.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    emailListCheckbox.removeClass('is-invalid'); // Remove class if input is valid
    $('#data-missing-error').empty();
    return true;
}

function validateDOB() {
    var dobInput = $('#registration-form-dob');
    if (!dobInput.val()) {
        dobInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    dobInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#dob-error').empty();
    return true;
}

$('#registration-form-dob').on('focusout', function () {
    validateDOB();
    // Check if the field is empty and add a red border if it is
    if (!$(this).val()) {
        $(this).addClass('border-danger');
    } else {
        $(this).removeClass('border-danger');
    }
});

// ---------login form---------
function validateLoginEmail() {
    var emailInput = $('#login-form-email');
    var pattern = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
    if (!emailInput.val()) {
        emailInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    if (!pattern.test(emailInput.val())) {
        emailInput.addClass('is-invalid'); // Add class for input border error
        $('#login-email-error').html(emailInput.data('invalidemail'));
        return false;
    }
    emailInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#login-email-error').empty();
    return true;
}

function validateLoginPassword() {
    var passwordInput = $('#login-form-password');
    if (!passwordInput.val()) {
        passwordInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    passwordInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#login-password-error').empty();
    return true;
}

$('#login-form-password').on('focusout', function () {
    validatePassword();
    // Check if the field is empty and add a red border if it is
    if (!$(this).val()) {
        $(this).addClass('border-danger');
    } else {
        $(this).removeClass('border-danger');
    }
});


// ------Forgot password-----
function validateRequestEmail() {
    var emailInput = $('#reset-password-email');
    var pattern = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
    if (!emailInput.val()) {
        emailInput.addClass('is-invalid'); // Add class for input border error
        return false;
    }
    if (!pattern.test(emailInput.val())) {
        emailInput.addClass('is-invalid'); // Add class for input border error
        $('#resetEmail').html(emailInput.data('invalidemail'));
        return false;
    }
    emailInput.removeClass('is-invalid'); // Remove class if input is valid
    $('#resetEmail').empty();
    return true;
}
