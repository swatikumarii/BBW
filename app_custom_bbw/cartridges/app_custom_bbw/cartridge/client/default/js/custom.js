'use strict';

// Open my account nav options in responsive
$('.mobile-my-account').on('click', function () {
    $('.my-account-nav').toggle('d-block');
    $(this).toggleClass('in');
});
