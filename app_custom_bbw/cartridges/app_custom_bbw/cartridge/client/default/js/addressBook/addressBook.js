'use strict';

var base = require('base/addressBook/addressBook');
var formValidation = require('../components/formValidation');
var action;
var isDefault;
var deleteUrl;

var location = window.location;

/**
 * Create an alert to display the error message
 * @param {object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error '
        + 'fade show" role="alert">'
        + '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'
        + '<span aria-hidden="true">&times;</span>'
        + '</button>' + message + '</div>';

    $('.error-messaging').append(errorHtml);
}

/**
 * This will update the url when success message is showned.
 */
$(document).on('readystatechange', function () {
    if (document.readyState === 'complete') {
        var url = new URL(window.location.href);
        if (url.searchParams.has('showstatusmsg')) {
            setTimeout(function () {
                url.searchParams.delete('showstatusmsg');
                window.history.replaceState(null, '', url.toString());
            }, 5000);
        }
    }
});

/**
 * This will check googlerecaptcha token and submit address form
 * @param {string} token - token
 */
window.submitAddressForm = function (token) {
    return new Promise(function (resolve, reject) {
        if (!token) {
            reject();
        }
        if (token !== '') {
            $('.g-recaptcha').closest('form.address-form').submit();
            resolve();
        }
        grecaptcha.reset();
    });
};

/**
 * updated the function for address-form submit
 */
base.submitAddress = function () {
    $('body').on('submit', 'form.address-form', function (e) {
        var $form = $(this);
        e.preventDefault();
        if ($form.serialize() !== window.addressForm) {
            action = $form.attr('action');
            $form.spinner().start();
            $('form.address-form').trigger('address:submit', e);
            $.ajax({
                url: action,
                type: 'post',
                dataType: 'json',
                data: $form.serialize(),
                success: function (data) {
                    $form.spinner().stop();
                    window.addressForm = ''; 
                    if (!data.success) {
                        formValidation($form, data);
                    } else {
                        location.href = data.redirectUrl;
                    }
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    }
                    $form.spinner().stop();
                }
            });
            return false;
        } 
        $('#address-form').modal('hide');
        return false;
    });
};

base.removeAddress = function () {
    $('body').on('click', '.remove-address', function (e) {
        e.preventDefault();
        isDefault = $(this).data('default');
        if (isDefault) {
            deleteUrl = $(this).data('url')
                + '?addressId='
                + $(this).data('id')
                + '&isDefault='
                + isDefault;
        } else {
            deleteUrl = $(this).data('url') + '?addressId=' + $(this).data('id');
        }
        $('.product-to-remove').empty().text($(this).data('id'));
    });
};

/**
 * updated the function for address-form submit
 */
base.removeAddressConfirmation = function () {
    $('body').on('click', '.delete-confirmation-btn', function (e) {
        e.preventDefault();
        $.ajax({
            url: deleteUrl,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $('#uuid-' + data.UUID).remove();
                if (isDefault) {
                    var addressId = $('.card .address-heading').first().text();
                    var addressHeading =
                        addressId + ' (' + data.defaultMsg + ')';
                    $('.card .address-heading').first().text(addressHeading);
                    $('.card .card-make-default-link').first().remove();
                    $('.remove-address').data('default', true);
                    if (data.message) {
                        var toInsert =
                            '<div><h3>' + data.message + '</h3><div>';
                        $('.addressList').after(toInsert);
                    }
                }
                window.location.href = data.redirectUrl;
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                }
                $.spinner().stop();
            }
        });
    });
};


/**
 * Get the address details to edit the address.
 */
$(document).on('click', '#editAddress', function () {
    action = $(this).data('href');
    var addressID = $(this).data('id');
    var data = {
        addressId: addressID
    };
    $.ajax({
        url: action,
        method: 'GET',
        data: data,
        success: function (response) {
            $('#modalContent').html(response);
            $('#address-form').modal('show');
            $('body').trigger('form:invalid');
            var addressForm = $(response)[0];
            window.addressForm = $(addressForm).serialize();
        }
    });
});

module.exports = base;

