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


$(document).on('click', '#editProfile', function () {
    var url = $(this).data('href');
    var addressID = $(this).data('id');
    var data = {
        addressId: addressID
    };
    $.ajax({
        url: url,
        method: 'GET',
        data: data,
        success: function (response) {
            $('#modalContent').html(response);
            $('#address-form').modal('show');
            // $('#addressId').val(response.addressForm.addressId.attributes);
            console.log('in success');
            $('body').trigger('form:invalid');
        },
        error: function (err) {
            console.log('in error');
        }
    });
});
