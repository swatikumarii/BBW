'use strict';

var baseContactUs = require('base/contactUs/contactUs');

/**
 * Display the returned message.
 * @param {string} data - data returned from the server's ajax call
 * @param {object} button - button that was clicked for contact us sign-up
 */
function displayMessage(data, button) {
    $.spinner().stop();
    var status;
    if (data.success) {
        status = 'alert-success';
    } else {
        status = 'alert-danger';
    }

    if ($('.contact-us-signup-message').length === 0) {
        $('body').append('<div class="contact-us-signup-message"></div>');
    }
    $('.contact-us-signup-message').append(
        '<div class="contact-us-signup-alert text-center ' +
            status +
            '" role="alert">' +
            data.msg +
            '</div>'
    );

    setTimeout(function () {
        $('.contact-us-signup-message').remove();
        button.removeAttr('disabled');
    }, 3000);
}
/**
 *  ajax call for subscribe contact
 */
function subscribeContact() {
    $('form.contact-us').submit(function (e) {
        e.preventDefault();
        var form = $(this);
        var button = $('.subscribe-contact-us');
        var url = form.attr('action');

        $.spinner().start();
        button.attr('disabled', true);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                displayMessage(data, button);
                if (data.success) {
                    $('.contact-us').trigger('reset');
                }
            },
            error: function (err) {
                displayMessage(err, button);
            }
        });
    });
}

window.submitContactUs = function (token) {
    return new Promise(function (resolve, reject) {
        if (grecaptcha === undefined) {
            reject();
        }

        var response = grecaptcha.getResponse();

        if (!response) {
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

var exportDetails = $.extend({}, baseContactUs, {
    subscribeContact: subscribeContact
});

module.exports = exportDetails;
