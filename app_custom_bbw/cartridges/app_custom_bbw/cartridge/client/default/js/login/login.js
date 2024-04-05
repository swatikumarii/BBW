'use strict';

var baselogin = require('base/login/login');

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
var exportDetails = $.extend({}, baselogin);

module.exports = exportDetails;
