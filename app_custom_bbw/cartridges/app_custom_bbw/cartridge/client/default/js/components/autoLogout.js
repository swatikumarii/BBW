'use strict';

/**
 * set soft auto logout callback
 * @param {number} autoLogout - list of attributes
 * @return {number} - setTimeout object
 */
function setLogoutTimer(autoLogout) {
    console.log('setLogoutTimer');
    if (autoLogout) {
        clearTimeout(autoLogout);
    }

    if (!localStorage.getItem('auto-logout')) {
        return 0;
    }

    var softTimeout = Number($('[data-soft-timeout]').data('soft-timeout')) || 44;
    var popupDuration = Number($('[data-popup-duration]').data('popup-duration')) || 2;
    var remainingTime = softTimeout - popupDuration;
    return setTimeout(function () {
        $('#autologout').find('.confirmation').show();
        $('#autologout').find('#login-refresh').show();
        if(!$('.timer').is(':visible')) {
            countdown(popupDuration, 0);
        }
        $('#autologout').find('.logout').hide();
        $('#autologout').find('#logout-refresh').hide();
        $('#autologout').modal();
        setTimeout(function () {
            localStorage.removeItem('auto-logout');
            localStorage.setItem('auto-logout:message', new Date().getTime());
            location.reload();
        }, popupDuration * 60000);
    }, remainingTime * 60000);
}

/**
 * set hard auto logout callback, this function will executes when user login & sign up
 */
function setLogoutTime() {
    var hardTimeout = Number($('[data-hard-timeout]').data('hard-timeout')) || 360;
    var time = hardTimeout * 60 * 1000;
    var logoutTime = new Date().getTime() + time;
    localStorage.setItem('auto-logout', logoutTime);
    localStorage.setItem('auto-logout:trigger', new Date().getTime());
}

/**
 * set hard auto logout callback
 */
function setHardLogoutTimer() {
    var logoutTime = Number(localStorage.getItem('auto-logout') || 0);
    var currentTime = new Date().getTime();
    if (currentTime < logoutTime) {
        setTimeout(function () {
            localStorage.removeItem('auto-logout');
            location.reload();
        }, logoutTime - currentTime);
    } else {
        localStorage.removeItem('auto-logout');
    }
}
/**
 * session out timer
 */
var timeoutHandle;
function countdown(minutes, seconds) {
    function tick() {
        var counter = document.getElementById("timer");
        counter.innerHTML =
            (minutes < 10 ? "0" : "") + minutes.toString() + ":" + (seconds < 10 ? "0" : "") + String(seconds);
        seconds--;
        if (seconds >= 0) {
            timeoutHandle = setTimeout(tick, 1000);
        } else {
            if (minutes >= 1) {
                setTimeout(function () {
                    countdown(minutes - 1, 59);
                }, 1000);
            }
        }
    }
    tick();
}

module.exports = function () {
    $(function () {
        // remove localStorage value if user is not logged in
        if ($('[data-is-authenticated]').data('is-authenticated') === false) {
            if (localStorage.getItem('auto-logout:message')) {
                $('#autologout').find('.confirmation').hide();
                $('#autologout').find('#login-refresh').hide();
                $('#autologout').find('.logout').show();
                $('#autologout').find('#logout-refresh').show();
                $('#autologout').modal();
            }
            localStorage.removeItem('auto-logout:message');
            localStorage.removeItem('auto-logout');
        }
        // Call hard auto logout callback function on document load
        setHardLogoutTimer();
        // Call auto logout callback function on document load and each request made to the sfcc server
        var autoLogout = setLogoutTimer();
        localStorage.setItem('auto-logout:trigger', new Date().getTime());
        $(document).ajaxStart(function () {
            localStorage.setItem('auto-logout:trigger', new Date().getTime());
            setLogoutTimer(autoLogout);
        });

        /**
         * attach event on auto logout continue button
         */
        $('body').on('click', '.refresh-autologout', function (e) {
            e.preventDefault();
            location.reload();
        });

        /**
         * attach event on user login
         */
        $('body').on('login:success', function () {
            setLogoutTime();
            setLogoutTimer(autoLogout);
        });

        /**
         * attach event on user register
         */
        $('body').on('login:register:success', function () {
            setLogoutTime();
            setLogoutTimer(autoLogout);
        });

        /**
         * update other tabs if request is made to the server
         */
        $(window).on('storage', function (e) {
            var event = e.originalEvent;
            if (event.storageArea !== localStorage) return;
            if (event.key === 'auto-logout:trigger') {
                console.log('auto-logout:trigger');
                setLogoutTimer(autoLogout);
            } else if (event.key === 'auto-logout:message') {
                $('#autologout').find('.confirmation').hide();
                $('#autologout').find('#login-refresh').hide();
                $('#autologout').find('.logout').show();
                $('#autologout').find('#logout-refresh').show();
                $('#autologout').modal();
            }
        });
    });
};
