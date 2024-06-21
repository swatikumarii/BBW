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
    var message = data.msg
        ? data.msg
        : $('#newsletter-input').attr('data-csrf-error');
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
    var data = { emailId: emailId, csrf_token: csrfToken };
    if (token) {
        data = {
            emailId: emailId,
            'g-recaptcha-response': token,
            csrf_token: csrfToken
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

$('[data-toggle="popover"]').popover();

// Show popover on mouseenter
$('[data-toggle="popover"]').on('mouseenter', function () {
    $(this).popover('show');
    $('.pdp-title').parents('.bs-popover-top').addClass('pdp-popover');
});

if (
    !localStorage.getItem('is-country-selector') 
    && $('.countrySelectPopup').data('country-selector-enabled')
) {
    var reqCountryDiv = $('#request-country-name');
    var countryCode = reqCountryDiv.data('country-code');
    var siteCountryCode = $('#site-country-code').text();
    if (countryCode !== siteCountryCode) {
        $('.countrySelectPopup').find('.modal').modal('show');
        var regionName = new Intl.DisplayNames(['en'], { type: 'region' });
        var countryDisplayName = regionName.of(countryCode);
        if(countryDisplayName){
            reqCountryDiv.text(countryDisplayName);
            $('#country-' + countryDisplayName).attr('selected', 'selected');
            siteCountryCode = $('#site-country-code').text();
            var siteCountryDisplayName = regionName.of(siteCountryCode);
            if (siteCountryDisplayName) {
                $('#site-country-code').text(siteCountryDisplayName);
            }
        }
    }
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
        localStorage.setItem('is-country-selector', true);
        var site = $('#selected-site').val();
        window.location.assign(site);
    })
    .on('click', '.country-stay-site', function () {
        localStorage.setItem('is-country-selector', true);
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
    // Cache the window and document objects for performance
    var $window = $(window);
    var $scrollToTopButton = $('.js-scrolltotop');

    // Function to calculate the scroll threshold
    /**
     * @returns {object} a promise
     */
    function calculateScrollThreshold() {
        var documentHeight = $(document).height();
        // Show the button when the user has scrolled past 70% of the document height
        // Ensure it is within the scrollable content
        return Math.min(0.7 * documentHeight, documentHeight - 630);
    }

    // Show or hide the scroll to top button based on scroll position
    $window.scroll(function () {
        let scrollThreshold = calculateScrollThreshold();
        var scrollTop = $window.scrollTop();
        var windowHeight = $window.height();

        // Adjust the threshold for smaller pages
        var showButtonScrollTop = Math.max(scrollThreshold, windowHeight);

        if (scrollTop > showButtonScrollTop - windowHeight) {
            $scrollToTopButton.fadeIn();
        } else {
            $scrollToTopButton.fadeOut();
        }
    });

    // Scroll to top when the button is clicked
    $scrollToTopButton.click(function () {
        $('html, body').animate({ scrollTop: 0 }, 800);
        return false;
    });

    // Calculate height of store in global locations
    var storeHeight = $('.store-location').height();
    var storeNewHeight = storeHeight + 20;
    $('.store-location').height(storeNewHeight);
});

module.exports = function () {
    $('.subscribe-email').on('click', function (e) {
        e.preventDefault();
        newsLetter();
    });
};
