// Required

'use strict';

// var scrollAnimate = require('base/components/scrollAnimate');

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
        $('.js-newsletter-msg').append('<div class="email-signup-message"></div>');
    }
    $('.email-signup-message').append(
        '<div class="email-signup-alert text-justify ' +
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
 * @param {string} token - reCAPTCHA token
 */
function newsLetter(token) {
    var url = $('.newsletter').data('href');
    var button = $('.subscribe-email');
    var emailId = $('input[name=hpEmailSignUp]').val();
    var data = { emailId: emailId };
    if (token) {
        data = {
            emailId: emailId,
            'g-recaptcha-response': token
        };
    }
    $.spinner().start();
    $('form.newsletter').attr('disabled', true);
    $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: data,
        success: function (dataRes) {
            displayMessage(dataRes, button);
        },
        error: function (err) {
            displayMessage(err, button);
        }
    });
}


window.submitNewsLetter = function (token) {
    return new Promise(function (resolve, reject) {
        if (!token) {
            reject();
        }
        if (token !== '') {
            newsLetter(token);
            resolve();
        }
        grecaptcha.reset();
    });
};

// Initialize popover 
$('[data-toggle="popover"]').popover({
    placement: 'top',
    html: true,
});

// Show popover on mouseenter
$('[data-toggle="popover"]')
    .on('mouseenter', function () {
        $(this).popover('show');
        $('.pdp-title').parents('.bs-popover-top').addClass('pdp-popover');
    });
    

var timer;
$('body').on(
    'mouseleave',
    '[data-toggle="popover"], .popover',
    function () {
        timer = setTimeout(function () {
            $('.popover').popover('hide');
        }, 50);
    }).on(
    'mouseenter',
    '[data-toggle="popover"], .popover',
    function () {
        clearTimeout(timer);
    }
);


// Close popover on close button click
$(document).on('click', '.popover .close', function () {
    $(this).parents('.popover').popover('hide');
});

/**
 * Back To Top - Click
 */

var scrolltotop = $('.js-scrolltotop');

$(window).scroll(function () {
    if ($(this).scrollTop() > 100) { // Adjust the value according to requirement
        console.log("Fading In");
        scrolltotop.fadeIn();
    } else {
        scrolltotop.fadeOut();
    }
});

// Scroll to top when the button is clicked

$('.js-scrolltotop').on('click', function () {
    $('html, body').animate({
        scrollTop: 0 // Scroll to top of the page
    }, 800);
});

module.exports = function () {
    $('.subscribe-email').on('click', function (e) {
        e.preventDefault();
        newsLetter();
    });
};
