'use strict';

// Open my account nav options in responsive
$('.mobile-my-account').on('click', function () {
    $('.my-account-nav').toggle('d-block');
    $(this).toggleClass('in');
});

var passwordInput = $('#password');
var showButton = $('.show-hide-password');

showButton.on('click', function () {
    var type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
    passwordInput.attr('type', type);
    $(this)
        .find('.show')
        .text(type === 'password' ? 'Show' : 'Hide');
});

var currentPasswordInput = $('#currentPassword');
var currentShowButton = $('.show-hide-current-password');

currentShowButton.on('click', function () {
    var type = currentPasswordInput.attr('type') === 'password' ? 'text' : 'password';
    currentPasswordInput.attr('type', type);
    $(this)
        .find('.show')
        .text(type === 'password' ? 'Show' : 'Hide');
});

var newPasswordInput = $('#newPassword');
var newShowButton = $('.show-hide-new-password');

newShowButton.on('click', function () {
    var type =
        newPasswordInput.attr('type') === 'password' ? 'text' : 'password';
    newPasswordInput.attr('type', type);
    $(this)
        .find('.show')
        .text(type === 'password' ? 'Show' : 'Hide');
});
