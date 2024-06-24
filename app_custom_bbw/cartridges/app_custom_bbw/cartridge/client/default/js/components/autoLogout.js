'use strict';

var helpers = require('../utils/scrollHelpers');
var timeoutId;
var warningTimeoutId;
var lastActivityKey = 'lastActivityTime';
var softTimeout =
        Number($('[data-soft-timeout]').data('soft-timeout')) || 44;
var warningDuration =
        Number($('[data-popup-duration]').data('popup-duration')) || 2;
var timeoutDuration = softTimeout - warningDuration;
timeoutDuration *= 60000;
/**
 * session out timer
 * @param {any} minutes countdown minutes
 * @param {any} seconds countdown seconds
 */
function countdown(minutes, seconds) {
    var secs = seconds;
    var counter = document.getElementById('timer');
    counter.innerHTML =
        (minutes < 10 ? '0' : '') +
        minutes.toString() +
        ':' +
        (secs < 10 ? '0' : '') +
        String(secs);
    secs--;
    if (secs >= 0) {
        setTimeout(function () {
            countdown(minutes, secs);
        }, 1000);
    } else if (minutes >= 1) {
        setTimeout(function () {
            countdown(minutes - 1, 59);
        }, 1000);
    }
};

/**
 *
 */
function showTimeoutPopup() {
    $('#autologout').find('.confirmation').show();
    $('#autologout').find('#login-refresh').show();
    helpers.disableScroll();
    if (!$('.timer').is(':visible')) {
        countdown(warningDuration, 0);
    }
    $('#autologout').find('.logout').hide();
    $('#autologout').find('#logout-refresh').hide();
    $('#autologout').modal();
    setTimeout(function () {
        $('#autologout').find('.confirmation').hide();
        $('#autologout').find('#login-refresh').hide();
        $('#autologout').find('.logout').show();
        $('#autologout').find('#logout-refresh').show();
        $('#autologout').modal();
        // force logout customer
        var logoutAction = $('.customLogoutUrl').val();
        $.ajax({
            url: logoutAction,
            type: 'GET',
            success: function () {
            }
        });
    }, warningDuration * 60000);
}
/**
 *
 */
function checkForTimeout() {
    var lastActivityTime = parseInt(localStorage.getItem(lastActivityKey), 10);
    var currentTime = Date.now();
    if (currentTime - lastActivityTime >= timeoutDuration) {
        showTimeoutPopup();
    } else {
        warningTimeoutId = setTimeout(showTimeoutPopup, timeoutDuration - (currentTime - lastActivityTime));
    }
}

/**
 *
 */
function resetTimeout() {
    if ($('.hide-sessionTimeOut').length === 0) {
        localStorage.setItem(lastActivityKey, Date.now());
        clearTimeout(timeoutId);
        clearTimeout(warningTimeoutId);
        timeoutId = setTimeout(checkForTimeout, timeoutDuration);
    }
}

$('#autologout').on('hide.bs.modal', function () {
    helpers.enableScroll();
});


module.exports = function () {
    $(function () {
        // Add event listeners to reset the timeout on user activity
        document.addEventListener('click', resetTimeout);

        /**
         * attach event on auto logout continue button
         */
        $('body').on('click', '.refresh-autologout', function (e) {
            e.preventDefault();
            window.location.reload();
        });

        // Listen for storage events to synchronize between tabs
        window.addEventListener('storage', function(event) {
            if (event.key === lastActivityKey) {
                clearTimeout(timeoutId);
                clearTimeout(warningTimeoutId);
                checkForTimeout();
            }
        });

        // Click outside the popup content reload the page
        $('#autologout').on('hidden.bs.modal', function () {
            window.location.reload();
        });

        // Initialize the timeout on page load
        resetTimeout();
    });
};
