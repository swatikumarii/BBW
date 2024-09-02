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
    $(this).find('.show').text(type === 'password' ? $(this).data('show-label') : $(this).data('hide-label'));
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

/**
 * Showing the content for show more functionality
 */
$(document).ready(function () {
    // Initially hide all childcontent items
    $('.wishlistItemCards').each(function () {
        var $childitems = $(this).find('.product-info');
        $childitems.hide();
        $childitems.slice(0, 3).show();
    });

    // When the show more button is clicked
    $('.view-more-btn').on('click', function (event) {
        // Prevent default behavior
        event.preventDefault();

        // Toggle the visibility of childcontent items
        var showBlog = $(this).parents('.wishlist-list').find('.product-info');

        showBlog.show();
        $(this).remove();
    });
});

$(document).ready(function() {
    $('#copyWishlistUrl').on('click', function() {
        // Select the input field
        var buttonName = $('#copyWishlistUrl').text();
        var textToCopy = $('#wishlistUrl').text();
        navigator.clipboard.writeText(textToCopy).then(function() {
            // Change the button text to "Copied"
            $('#copyWishlistUrl').text($('#copyWishlistUrl').data('copied'));
            setTimeout(function() {
                $('#copyWishlistUrl').text(buttonName);
            }, 2000); // 2 seconds
        });
    });
});


