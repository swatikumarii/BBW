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
    var message = data.msg ? data.msg : $('#newsletter-input').attr('data-csrf-error');
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
            message +
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

if (!localStorage.getItem('is-country-selector') && ($('countrySelectPopup').data('country-selector-enabled'))) {
    $('.countrySelectPopup').find('.modal').modal('show');
    var reqCountryDiv = $('#request-country-name');
    var countryCode = reqCountryDiv.data('country-code');
    var regionName = new Intl.DisplayNames(['en'], {type: 'region'});
    var countryDisplayName = regionName.of(countryCode);
    reqCountryDiv.text(countryDisplayName);
}

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
        localStorage.setItem('is-country-selector',true);
        var site = $('#selected-site').val();
        window.location.assign(site);
    })
    .on('click', '.country-stay-site', function () {
        localStorage.setItem('is-country-selector',true);
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
$(document).ready(function () {
    var windowHeight = $(window).height();
    var documentHeight = $(document).height();
    var scrollThreshold = Math.max(documentHeight - windowHeight, 0.5 * windowHeight); // Ensure the scrollThreshold is at least 30% of window height

    $(window).scroll(function () {
        if ($(this).scrollTop() > scrollThreshold) {
            $('.js-scrolltotop').fadeIn();
        } else {
            $('.js-scrolltotop').fadeOut();
        }
    });

    // Function to scroll to top when the button is clicked
    $('.js-scrolltotop').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 800);
        return false;
    });
});


module.exports = function () {
    $('.subscribe-email').on('click', function (e) {
        e.preventDefault();
        newsLetter();
    });
};
