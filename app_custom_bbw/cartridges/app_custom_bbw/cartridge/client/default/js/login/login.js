'use strict';

var baselogin = require('base/login/login');
var formValidation = require('../components/formValidation');
var createErrorNotification = require('base/components/errorNotification');
var location = window.location;

window.submitLogin = function (token) {
    return new Promise(function (resolve, reject) {
        if (!token) {
            reject();
        }
        if (token !== '') {
            $('.g-recaptcha').closest('form.login').submit();
            resolve();
        }
        grecaptcha.reset();
    });
};

window.submitLoginModal = function (token) {
    return new Promise(function (resolve, reject) {
        if (!token) {
            reject();
        }
        if (token !== '') {
            $('.g-recaptcha').closest('form.modal-login').submit();
            resolve();
        }
        grecaptcha.reset();
    });
};

window.submitRegistration = function (token) {
    return new Promise(function (resolve, reject) {
        if (!token) {
            reject();
        }
        if (token !== '') {
            $('.g-recaptcha').closest('form.registration').submit();
            resolve();
        }
        grecaptcha.reset();
    });
};

/**
 *  To register user
 */
function register() {
    $('form.registration').submit(function (e) {
        var form = $(this);
        e.preventDefault();
        var url = form.attr('action');
        form.spinner().start();
        $('form.registration').trigger('login:register', e);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                form.spinner().stop();
                if (!data.success) {
                    $('form.registration').trigger('login:register:error', data);
                    formValidation(form, data);
                } else {
                    $('.register-success').removeClass('d-none');
                    $('form.registration').trigger('login:register:success', data);
                    setTimeout(function () {
                        $('.register-success').addClass('d-none');
                        location.href = data.redirectUrl;
                    }, 2000);
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification($('.error-messaging'), err.responseJSON.errorMessage);
                }

                form.spinner().stop();
            }
        });
        return false;
    });
}

/**
 *  To login user
 */
function login() {
    $('form.login, form.modal-login').submit(function (e) {
        var form = $(this);
        e.preventDefault();
        var url = form.attr('action');
        form.spinner().start();
        form.trigger('login:submit', e);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                form.spinner().stop();
                if (!data.success) {
                    if (data.isMigratedNotUpdated) {
                        if (form.hasClass('login')) {
                            $('#loginModal').modal('show');
                        }
                        $('.migration-login-message').removeClass('d-none');
                        $('.login-form-div').addClass('d-none');
                        $('.login-modal-body .privacy-block').addClass(
                            'd-none'
                        );
                    } else {
                        formValidation(form, data);
                        form.trigger('login:error', data);
                    }
                } else {
                    form.trigger('login:success', data);
                    if (data.isIncomplete) {
                        sessionStorage.setItem('profileIncomplete', true);
                    }
                    if (data.showCartMergePopup) {
                        window.storedBasketProducts = data.storedBasketProducts;
                        $('.loginPopup').find('#loginModal').modal('hide');
                        $('.redirect-url').val(data.redirectUrl);
                        $('.loginPopup')
                            .find('#isMergeCartModal')
                            .modal('show');
                    } else {
                        if ($('.loginPopup input[name="wishlist-pid"]').val()) {
                            localStorage.setItem('addToWishList', true);
                        }
                        var isForgotUrl = false;
                        $('.forgot-password-url').each(function () {
                            if(
                                window.location.href.substring(
                                    window.location.href.length -
                                        $(this).val().length
                                ) === $(this).val()
                            ) {
                                isForgotUrl = true;
                            }
                        });
                        if (isForgotUrl) {
                            window.location.href = $('.home-show-url').val();
                        } else if (data.redirectUrl.indexOf('Page-Show') !== -1) {
                            window.location.reload();
                        } else {
                            window.location.href = data.redirectUrl;
                        }
                    }
                }
            },
            error: function (data) {
                if (data.responseJSON.redirectUrl) {
                    window.location.href = data.responseJSON.redirectUrl;
                } else {
                    form.trigger('login:error', data);
                    form.spinner().stop();
                }
            }
        });
    });

    $('#loginModal').on('hidden.bs.modal', function () {
        $('.migration-login-message').addClass('d-none');
        $('.login-form-div').removeClass('d-none');
        $('.login-modal-body .privacy-block').removeClass('d-none');
    });

};

/**
 *
 */
function cartMerge() {
    $('.merge').on('click', function () {
        var redirectUrl = $('.redirect-url').val();
        var cartMergeUrl = $('.cart-merge-url').val();
        var storedBasketProducts = window.storedBasketProducts;
        $.ajax({
            url: cartMergeUrl,
            type: 'post',
            data: { storedBasketProducts: JSON.stringify(storedBasketProducts) },
            dataType: 'json',
            success: function () {
                if (redirectUrl.indexOf('Page-Show') !== -1) {
                    window.location.reload();
                } else {
                    window.location.href = redirectUrl;
                }
            },
            error: function () {
                window.location.href = redirectUrl;
            }
        });
        return false;
    });
    $('.dont-merge').on('click', function () {
        var redirectUrl = $('.redirect-url').val();
        if (redirectUrl.indexOf('Page-Show') !== -1) {
            window.location.reload();
        } else {
            window.location.href = redirectUrl;
        }
    });
    $('#isMergeCartModal').on('hidden.bs.modal', function () {
        var redirectUrl = $('.redirect-url').val();
        if (redirectUrl.indexOf('Page-Show') !== -1) {
            window.location.reload();
        } else {
            window.location.href = redirectUrl;
        }
    });
};
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
    var pattern = /^\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
    if (!validateRequiredField(emailInput)) return false;
    if (!pattern.test(emailInput.val())) {
        emailInput.addClass('is-invalid border-danger'); // Add class for input border error
        $('#' + emailInput.attr('id') + '-error').empty(); // Display error message
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
function validatePasswordFieldWithValidation(passwordInput) {
    var rules = [
        { name: 'rule8to50char', pattern: /^.{8,50}$/ },
        { name: 'rule1lowercase', pattern: /[a-z]/ },
        { name: 'rule1uppercase', pattern: /[A-Z]/ },
        { name: 'rule1number', pattern: /\d/ },
        { name: 'ruleNoSpaces', pattern: /^\S*$/ },
        { name: 'ruleSpecialChar', pattern: /[@$!%*?&]/ }
    ];

    validateRequiredField(passwordInput);

    if (passwordInput.val().length === 0) {
        rules.forEach(function (rule) {
            if (rule.name !== 'ruleNoSpaces') {
                $('#' + rule.name)
                    .removeClass('success')
                    .addClass('error');
            }
        });
        return false;
    }
    // Remove existing success messages and ticks
    passwordInput.closest('.form-group').find('.text-success').remove();
    passwordInput.closest('.form-group').find('.far').remove();

    rules.forEach(function (rule) {
        if (rule.pattern.test(passwordInput.val())) {
            $('#' + rule.name)
                .removeClass('error')
                .addClass('success');
        } else {
            $('#' + rule.name)
                .removeClass('success')
                .addClass('error');
        }
    });

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
    $(document.body).on('click', '.login-modal-password-hide', function () {
        togglePasswordVisibility($('#login-modal-form-password'), $(this));
    });
    $(document.body).on('click', '.login-modal-hide', function () {
        togglePasswordVisibility($('#login-form-password'), $(this));
    });
});
var validationFields = [
    {
        selector: '#loginModal-form-email',
        validationFunction: validateEmailField
    },
    {
        selector: '#login-modal-form-password',
        validationFunction: validatePasswordField
    },
    {
        selector: '#login-form-email',
        validationFunction: validateEmailField
    },
    {
        selector: '#login-form-password',
        validationFunction: validatePasswordField
    },
    {
        selector: '#reset-password-email',
        validationFunction: validateEmailField
    },
    {
        selector: '#registration-form-password',
        validationFunction: validatePasswordFieldWithValidation
    }
];
// Loop through the array and attach blur event handlers dynamically
validationFields.forEach(function (field) {

    if (field.selector === '#registration-form-password') {
        $(document).on('keyup', field.selector, function () {
            validateField(field.selector, field.validationFunction);
        });
    }

    $(document).on('blur', field.selector, function () {
        validateField(field.selector, field.validationFunction);
    });
});

$('#registration-form-password').click(function () {
    $('.required-pass').removeClass('d-none');
});

$('body').click(function (event) {
    // Check if the clicked element is not inside the #registration-form-password element
    if (!$(event.target).closest('#registration-form-password').length) {
        $('.required-pass').addClass('d-none');
    }
});

$('.mobile-slide-cancel').click(function () {
    $('#mobile-slide-search').val('');
});

$(document).on('submit', 'form#menu-search', function (e) {
    if (!$('#mobile-slide-search').val() || $('#mobile-slide-search').val().length < 3) {
        e.preventDefault();
    }
});

var exportDetails = $.extend({}, baselogin, {
    register: register,
    cartMerge: cartMerge,
    login: login
});

module.exports = exportDetails;
