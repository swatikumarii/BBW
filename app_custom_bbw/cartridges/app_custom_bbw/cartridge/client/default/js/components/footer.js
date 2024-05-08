// Required

'use strict';

// var scrollAnimate = require('base/components/scrollAnimate');

/**
 * appends params to a url
 * @param {string} data - data returned from the server's ajax call
 * @param {string} button - submit button
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
        $('.js-newsletter-msg').append(
            '<div class="email-signup-message"></div>'
        );
    }
    $('.email-signup-message').append(
        '<div class="email-signup-alert text-justify ' +
            status +
            '">' +
            data.msg +
            '</div>'
    );
    var newsLetterInput = $('#newsletterInput');
    if (status === 'alert-danger') {
        newsLetterInput.addClass('is-invalid');
    } else {
        newsLetterInput.removeClass('is-invalid'); // Remove 'is-invalid' class if status is not 'alert-danger'
    }
    setTimeout(function () {
        $('.email-signup-message').remove();
        button.removeAttr('disabled');
        newsLetterInput.removeClass('is-invalid');
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
    var csrfToken = $('input[name=csrf_token]').val();
    var data = { emailId: emailId, 'csrf_token': csrfToken };
    if (token) {
        data = {
            emailId: emailId,
            'g-recaptcha-response': token,
            'csrf_token': csrfToken
        };
    }

    $.spinner().start();
    $('form.newsletter').attr('disabled', true);
    $('.subscribe-email').attr('disabled', true);
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
    html: true
});

// Show popover on mouseenter
$('[data-toggle="popover"]').on('mouseenter', function () {
    $(this).popover('show');
    $('.pdp-title').parents('.bs-popover-top').addClass('pdp-popover');
});

$('.countrySelectPopup').find('.modal').modal('show');
var timer;
$('body')
    .on('mouseleave', '[data-toggle="popover"], .popover', function () {
        timer = setTimeout(function () {
            $('.popover').popover('hide');
        }, 50);
    })
    .on('mouseenter', '[data-toggle="popover"], .popover', function () {
        clearTimeout(timer);
    })
    .on('click', '#switch-site', function () {
        var site = $('#selected-site').val();
        window.location.replace(site);
    });
// Close popover on close button click
$(document).on('click', '.popover .close', function (e) {
    e.preventDefault(); // Prevent default behavior of anchor tag
    $(this).parents('.popover').popover('hide');
});

// Function to handle scroll event
/**
 *
 */
// Define a function to handle scroll event and show/hide back-to-top button
function handleScroll() {
    // Get the height of the window
    var windowHeight = $(window).height();
    // 70% of window height
    var scrollThreshold = 0.7 * windowHeight; 

    if ($(window).scrollTop() > scrollThreshold) {
        $('.js-scrolltotop').fadeIn();
    } else {
        $('.js-scrolltotop').fadeOut();
    }
}
// Function to scroll to top when the button is clicked
function scrollToTop() {
    $('html, body').animate(
        {
            scrollTop: 0 // Scroll to the top of the page
        },
        800
    );
}

// Bind scroll event handler
$(window).scroll(handleScroll);

// Trigger scroll event initially
$(document).ready(function () {
    handleScroll();
});

// Bind click event to scroll to top when the button is clicked
$('.js-scrolltotop').on('click', scrollToTop);

module.exports = function () {
    $('.subscribe-email').on('click', function (e) {
        e.preventDefault();
        newsLetter();
    });
};
