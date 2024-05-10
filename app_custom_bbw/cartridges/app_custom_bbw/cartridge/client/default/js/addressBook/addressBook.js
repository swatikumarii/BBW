'use strict';

var base = require('base/addressBook/addressBook');
var formValidation = require('../components/formValidation');
var action;
var location = window.location;

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
        }
    });
});

module.exports = base;

