'use strict';

var helpers = require('../utils/helpers');
const { submit } = require('./clientSideValidation');

// Promo Modal - shown event
$('.promotionModal').on('shown.bs.modal', function () {
    $('body').addClass('promo-modal-open');
});

// Promo Modal - Hidden event
$('.promotionModal').on('hidden.bs.modal', function () {
    $('body').removeClass('promo-modal-open');
});

// Add class for - FireFox Browser
if (helpers.getBrowserType() === 'Mozilla Firefox') {
    $('html').addClass('firefox');
}

$(document).on('submit','.gated-popup form', function (e) {
    e.preventDefault();
    var form = $(this).serialize();
    $.ajax({
        type: 'POST',
        url: $(this).attr('action'),
        data: form,
        success: function (response) {
            if (response.success) {
                window.location.reload();
            } else {
                window.location.href = response.redirectUrl;
            }
        }
    });
});
