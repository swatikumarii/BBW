'use strict';

var baselogin = require('base/login/login');
var formValidation = require('base/components/formValidation');
var createErrorNotification = require('base/components/errorNotification');

var location = window.location;

/**
 *  use for login form submit.
 */
function login() {
    $('form.login').submit(function (e) {
        var form = $(this);
        e.preventDefault();
        var url = form.attr('action');
        form.spinner().start();
        $('form.login').trigger('login:submit', e);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                form.spinner().stop();
                if (!data.success) {
                    formValidation(form, data);
                    $('form.login').trigger('login:error', data);
                } else {
                    $('form.login').trigger('login:success', data);
                    location.href = data.redirectUrl;
                }
            },
            error: function (data) {
                if (data.responseJSON.redirectUrl) {
                    window.location.href = data.responseJSON.redirectUrl;
                } else {
                    $('form.login').trigger('login:error', data);
                    form.spinner().stop();
                }
            }
        });
        return false;
    });
}

/**
 *  use for new user registration.
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
                    $('form.registration').trigger(
                        'login:register:error',
                        data
                    );
                    formValidation(form, data);
                } else {
                    $('form.registration').trigger(
                        'login:register:success',
                        data
                    );
                    location.href = data.redirectUrl;
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(
                        $('.error-messaging'),
                        err.responseJSON.errorMessage
                    );
                }

                form.spinner().stop();
            }
        });
        return false;
    });
}

/**
 *  use for password reset.
 */
function resetPassword() {
    $('.reset-password-form').submit(function (e) {
        var form = $(this);
        e.preventDefault();
        var url = form.attr('action');
        form.spinner().start();
        $('.reset-password-form').trigger('login:register', e);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                form.spinner().stop();
                if (!data.success) {
                    formValidation(form, data);
                } else {
                    $('.request-password-title').text(data.receivedMsgHeading);
                    $('.request-password-body')
                        .empty()
                        .append('<p>' + data.receivedMsgBody + '</p>');
                    if (!data.mobile) {
                        $('#submitEmailButton')
                            .text(data.buttonText)
                            .attr('data-dismiss', 'modal');
                    } else {
                        $('.send-email-btn')
                            .empty()
                            .html(
                                '<a href="' +
                                    data.returnUrl +
                                    '" class="btn btn-primary btn-block">' +
                                    data.buttonText +
                                    '</a>'
                            );
                    }
                }
            },
            error: function () {
                form.spinner().stop();
            }
        });
        return false;
    });
}

/**
 *  use for clear reset form.
 */
function clearResetForm() {
    $('#login .modal').on('hidden.bs.modal', function () {
        $('#reset-password-email').val('');
        $('.modal-dialog .form-control.is-invalid').removeClass('is-invalid');
    });
}

window.submitLogin = function (token) {
    return new Promise(function (resolve, reject) {
        if (grecaptcha === undefined) {
            reject();
        }

        var response = grecaptcha.getResponse();
        if (!response) {
            reject();
        }
        if (token !== '') {
            $('.g-recaptcha').closest('form.login').submit();
            resolve();
        }
        grecaptcha.reset();
    });
};

window.submitRegistration = function (token) {
    return new Promise(function (resolve, reject) {
        if (grecaptcha === undefined) {
            reject();
        }

        var response = grecaptcha.getResponse();

        if (!response) {
            reject();
        }
        if (token !== '') {
            $('.g-recaptcha').closest('form.registration').submit();
            resolve();
        }
        grecaptcha.reset();
    });
};

window.checkRecaptcha = function () {
    grecaptcha.reset();
    // Fire reCaptcha
    grecaptcha.execute();
    // Fire desired behavior AFTER reCaptcha is complete
    window.submitRegistration();
    window.submitLogin();
};
/**
 * To execute reCAPTCHA
 */
function executeRecaptcha() {
    grecaptcha.execute();
}
window.initializeRecaptcha = function () {
    $('.login #gcaptchabtn').on('click', executeRecaptcha);
    $('.login').on('keypress', function (event) {
        // If the user presses the "Enter" key on the keyboard
        if (event.key === 'Enter') {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            $('.loginForm #gcaptchabtn').click();
        }
    });
    $('.registration #gcaptchabtn').on('click', executeRecaptcha);
    $('.registration').on('keypress', function (event) {
        // If the user presses the "Enter" key on the keyboard
        if (event.key === 'Enter') {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            $('.registration #gcaptchabtn').click();
        }
    });
};
var exportDetails = $.extend({}, baselogin, {
    clearResetForm: clearResetForm,
    resetPassword: resetPassword,
    login: login,
    register: register
});

module.exports = exportDetails;
