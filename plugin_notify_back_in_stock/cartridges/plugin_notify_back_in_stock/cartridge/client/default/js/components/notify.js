'use strict';

// Add user to notify me list

/**
 * This functions is used to call the BackInStock-Notify controller to add email to the custom Object
 * @param {object} data : Data  of the user's email and other details
 * @param {string} pId : Product Id
 */
function addToNotifyList(data, pId) {
    if (data.notifyMeEmail || data.pid) {
        return;
    }
    var mainClass = '.main-quantity-' + pId;
    var action = $('.notify-me-form').attr('action');
    $('#submitNotifyMeButton').spinner().start();
    $.ajax({
        url: action,
        type: 'post',
        dataType: 'json',
        data: data,
        success: function (response) {
            if (sessionStorage.getItem('notifyMeRegisteredProducts')) {
                var notifyMeRegisteredProducts = sessionStorage.getItem(
                    'notifyMeRegisteredProducts'
                );
                notifyMeRegisteredProducts.push(pId);
            } else {
                sessionStorage.setItem('key', [pId]);
            }

            $('#submitNotifyMeButton').spinner().stop();
            $(mainClass)
                .find('.notifyBackInStockButton')
                .text($(mainClass).find('#notify-list-msg').val());
            $(mainClass)
                .find('.notifyBackInStockButton')
                .attr('disabled', 'disabled');

            $('#notify-me-email').val('');
            $('.notify-me-oos-success-msg').show();
            $('.notify-me-oos-success-msg').text(response.msg);
            if (response.status) {
                setTimeout(function () {
                    $('#requestUserEmailForOOSModal').modal('hide');
                    $('.notify-me-oos-success-msg').fadeOut();
                }, 5000);
            } else {
                $('.notify-me-oos-success-msg').addClass('h-clr--red');
            }
        },
        error: function () {
            $('#submitNotifyMeButton').spinner().stop();
        }
    });
}

// Adding click event listener to notify me button to check whether user is registered or not and perform action accordingly
$(document).on('click', '.notifyBackInStockButton', function (e) {
    var pId = $(this).attr('data-pid');
    var mainClass = '.main-quantity-' + pId;
    e.preventDefault();
    $.ajax({
        url: $(this).attr('data-url'),
        type: 'post',
        dataType: 'json',
        data: { pid: pId },
        success: function (data) {
            if (data.available) {
                $(mainClass).find('.notify-me-available-msg').show();
                $(mainClass)
                    .find('.notify-me-available-msg')
                    .text(data.message);
                setTimeout(function () {
                    $(mainClass).find('.notify-me-available-msg').fadeOut();
                }, 3000);
                return;
            }
            if (data.registered) {
                addToNotifyList('pid=' + pId, pId);
            } else {
                $('#requestUserEmailForOOSModal img.image').attr(
                    'src',
                    $(mainClass).find('.notifyBackInStockButton').data(window.devicePixelRatio >= 2 ? 'img2x' : 'img')
                );
                $('#requestUserEmailForOOSModal img.image').attr(
                    'data-src',
                    $(mainClass).find('.notifyBackInStockButton').data(window.devicePixelRatio >= 2 ? 'img2x' : 'img')
                );
                $('#requestUserEmailForOOSModal span.product-name').text(
                    $(mainClass).find('.notifyBackInStockButton').data('pname')
                );
                $('#requestUserEmailForOOSModal form.notify-me-form').attr(
                    'data-pid',
                    pId
                );
                $('#requestUserEmailForOOSModal .notifyProductID').val(pId);
                $('#requestUserEmailForOOSModal').modal('show');
                $('body').addClass('open-notify');
            }
        }
    });
});

// modal form clear after hide
$('#requestUserEmailForOOSModal.modal').on('hidden.bs.modal', function () {
    $('body').removeClass('open-notify');
    $('#notify-me-email').val('');
    $('.modal-dialog .form-control.is-invalid').removeClass('is-invalid');
    $('#notify-me-email')
        .parents('.form-group')
        .find('.invalid-feedback')
        .empty();
    $('#notify-me-email')
        .parents('.form-group')
        .find('.form-control-label')
        .show();
});

/**
 * Function to validate the email entered by the user..
 * @param {string} email : Email entered by user.
 * @returns {boolean} : Returns Bool value of whether or not the entered email is valid.
 */
function validateEmail(email) {
    var regex = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    return regex.test(email);
}
// ^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$
// use custom email if user is unregistered
$('body').on('click', '#submitNotifyMeButton', function (e) {
    e.preventDefault();

    var pId = $('.outOfstockModal.show form.notify-me-form').attr('data-pid');
    addToNotifyList(
        $('.outOfstockModal.show form.notify-me-form').serialize(),
        pId
    );
});

// use custom email if user is unregistered
$('body').on('keyup', '#notify-me-email', function (e) {
    e.preventDefault();
    $(this).parent().find('.invalid-feedback').text('').hide();
    var email = $(this).val();
    if (!email) {
        $('#submitNotifyMeButton').attr('disabled', 'disabled');
    } else if (!validateEmail(email)) {
        $(this)
            .parent()
            .find('.invalid-feedback')
            .text($(this).data('pattern-mismatch'))
            .show();
        $('#submitNotifyMeButton').attr('disabled', 'disabled');
    } else {
        $('#submitNotifyMeButton').removeAttr('disabled');
    }
});

$('form.notify-me-form').on('submit', function (e) {
    e.preventDefault();
    var pId = $('.outOfstockModal.show form.notify-me-form').attr('data-pid');
    addToNotifyList(
        $('.outOfstockModal.show form.notify-me-form').serialize(),
        pId
    );
});

$('body').on('product:afterAttributeSelect', function (e, param) {
    e.preventDefault();
    $('body')
        .find('.js-add-to-cart-button')
        .empty()
        .append(param.data.product.addToCartHtml);
});

module.exports = {};
