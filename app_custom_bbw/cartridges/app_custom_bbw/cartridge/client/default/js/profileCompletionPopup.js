'use strict';

/**
 * Checks if the profile is completed or not
 */
$(document).ready(function () {
    var profileInComplete = sessionStorage.getItem('profileIncomplete');
    var isCheckoutPage = $('.checkout-steps').length;
    if (profileInComplete && !isCheckoutPage) {
        setTimeout(function () {
            $('.profile_complete').show();
            sessionStorage.removeItem('profileIncomplete');
        }, 5);
    }
    $(document).on('click', '.modal-close-icon, .modal-close-button ,.redirect-profile ', function () {
        $('.profile_complete').hide();
        if ($(this).hasClass('redirect-profile')) {
            var redirectUrl = $(this).data('action');
            window.location.href = redirectUrl;
        }
    });
});
