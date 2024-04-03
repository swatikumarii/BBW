'use strict';

var scrollAnimate = require('base/components/scrollAnimate');

/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 * @param {object} button - button that was clicked for email sign-up
 */
function displayMessage(data, button) {
    $.spinner().stop();
    var status;
    if (data.success) {
        status = 'alert-success';
    } else {
        status = 'alert-danger';
    }

    if ($('.email-signup-message').length === 0) {
        $('body').append('<div class="email-signup-message"></div>');
    }
    $('.email-signup-message').append(
        '<div class="email-signup-alert text-center ' +
            status +
            '">' +
            data.msg +
            '</div>'
    );

    setTimeout(function () {
        $('.email-signup-message').remove();
        button.removeAttr('disabled');
    }, 3000);
}

/**
 * ajax call for news letter
 */
function newsLetter() {
    var url = $('.subscribe-email').data('href');
    var button = $('.subscribe-email');
    var emailId = $('input[name=hpEmailSignUp]').val();
    $.spinner().start();
    $('form.newsletter').attr('disabled', true);
    $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: {
            emailId: emailId
        },
        success: function (data) {
            displayMessage(data, button);
        },
        error: function (err) {
            displayMessage(err, button);
        }
    });
}

window.submitNewsLetter = function (token) {
    return new Promise(function (resolve, reject) {
        if (grecaptcha === undefined) {
            reject();
        }

        var response = grecaptcha.getResponse();

        if (!response) {
            reject();
        }
        if (token !== '') {
            newsLetter();
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
    window.submitNewsLetter();
};

/**
 * to execute reCAPTCHA
 */
function executeRecaptcha() {
    grecaptcha.execute();
}
window.initializeRecaptcha = function () {
    $('.newsletter #gcaptchabtn').on('click', executeRecaptcha);
    $('.newsletter').on('keypress', function (event) {
        // If the user presses the "Enter" key on the keyboard
        if (event.key === 'Enter') {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            $('.contact-us #gcaptchabtn').click();
        }
    });
};

module.exports = function () {
    $('.back-to-top').click(function () {
        scrollAnimate();
    });
};
