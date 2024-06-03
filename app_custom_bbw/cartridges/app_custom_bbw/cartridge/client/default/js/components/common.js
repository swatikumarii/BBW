'use strict';

// Promo Modal - shown event
$('.promotionModal').on('shown.bs.modal', function () {
    $('body').addClass('promo-modal-open');
});

// Promo Modal - Hidden event
$('.promotionModal').on('hidden.bs.modal', function () {
    $('body').removeClass('promo-modal-open');
});
