'use strict';

var baseContactUs = require('base/contactUs/contactUs');


window.submitContactUs = function (token) {
    return new Promise(function (resolve, reject) {
        if (!token) {
            reject();
        }
        if (token !== '') {
            $('.g-recaptcha').closest('form.contact-us').submit();
            resolve();
        }
        grecaptcha.reset();
    });
};
/**
 * In case of failure
 */
window.checkRecaptcha = function () {
    // Re-initialize reCaptcha
    grecaptcha.reset();
    // Fire reCaptcha
    grecaptcha.execute();
    // Fire desired behavior AFTER reCaptcha is complete
    window.submitContactUs();
};
/**
 * to execute reCAPTCHA
 */
function executeRecaptcha() {
    grecaptcha.execute();
}
window.initializeRecaptcha = function () {
    $('.contact-us #gcaptchabtn').on('click', executeRecaptcha);
    $('.contact-us').on('keypress', function (event) {
        // If the user presses the "Enter" key on the keyboard
        if (event.key === 'Enter') {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            $('.contact-us #gcaptchabtn').click();
        }
    });
};

var exportDetails = $.extend({}, baseContactUs);

module.exports = exportDetails;
