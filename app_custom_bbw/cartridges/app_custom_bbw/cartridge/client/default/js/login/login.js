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
                    $('form.registration').trigger('login:register:success', data);
                    location.href = data.redirectUrl;
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


baselogin.login = function () {
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
                    if (data.showCartMergePopup) {
                        $('.loginPopup').find('#loginModal').modal('hide');
                        $('.redirect-url').val(data.redirectUrl);
                        $('.loginPopup').find('#isMergeCartModal').modal('show');
                    } else {
                        window.location.href = data.redirectUrl;
                    }
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
};

/**
 *
 */
function cartMerge() {
    $('.merge').on('click',function () {
        var redirectUrl = $('.redirect-url').val();
        var cartMergeUrl = $('.cart-merge-url').val();
        $.ajax({
            url: cartMergeUrl,
            type: 'get',
            success: function () {
                window.location.href = redirectUrl;
            },
            error: function () {
                window.location.href = redirectUrl;
            }
        });
        return false;
    });
    $('.dont-merge').on('click', function () {
        var redirectUrl = $('.redirect-url').val();
        window.location.href = redirectUrl;
        return false;
    });
    $('#isMergeCartModal').on('hidden.bs.modal', function () {
        var redirectUrl = $('.redirect-url').val();
        window.location.href = redirectUrl;
        return false;
    });
};
var exportDetails = $.extend({}, baselogin, {
    register: register,
    cartMerge: cartMerge
});

module.exports = exportDetails;
