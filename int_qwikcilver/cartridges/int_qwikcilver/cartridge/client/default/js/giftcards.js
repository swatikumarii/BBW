'use strict';


var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * updates the totals summary
 * @param {Array} totals - the totals data
 */
function updateGiftPendingTotals(totals) {
    if (totals.pendingTotal.isAmountPending) {
        $('.gift-total')
            .empty()
            .append('- ' + totals.pendingTotal.giftTotal);
        $('.grand-total-sum').empty().append(totals.pendingTotal.pendingAmount);
        $('#plain-grand-total-sum').val(totals.pendingTotal.pendingAmountValue);
        $('#afterpay-widget-amount').val(
            totals.pendingTotal.pendingAmountValue
        );
        $('.order-gift-total').show();
    } else {
        $('.order-gift-total').hide();
        $('.grand-total-sum').empty().append(totals.grandTotal);
    }
    $('.giftcard-total').empty().text(totals.pendingTotal.giftTotal);
    // update order total
    if (totals.orderTotal) {
        $('.order-total-sum').empty().append(totals.orderTotal);
        $('.order-total').removeClass('d-none');
    } else {
        $('.order-total').addClass('d-none');
    }
}


$(document).ready(function () {
    $('#giftcard-redeem').on('click', function (e) {
        e.preventDefault();
        var cardNumber = $('.gift-card-apply')
            // eslint-disable-next-line quotes
            .find("input:text[name='egift-number']")
            .val();
        var cardPin = $('.gift-card-apply')
            // eslint-disable-next-line quotes
            .find("input:text[name='egift-pin']")
            .val();
        var redeemGifCardUrl = $('input[name=redeem-giftcard-url]').val();
        cardNumber = cardNumber.replace(/\s/g, '');
        var form = {
            cardNo: cardNumber,
            cardPin: cardPin
        };
        $.spinner().start();
        $.ajax({
            url: redeemGifCardUrl,
            method: 'POST',
            data: form,
            success: function (data) {
                if (data.error) {
                    if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                        return;
                    }
                    $('.gift-redeem-card-error').show()
                        .empty()
                        .append(
                            '<span class="giftcard-redeem-error">' +
                                data.errorMessage +
                                '</span>'
                        );
                    setTimeout(function () {
                        $('.gift-redeem-card-error').hide();
                        $('.giftcard-redeem-error').remove();
                    }, 5000);

                    $('.giftcard-balance-wrap').empty();
                    $('.giftcard-balance-status-wrap').empty();
                } else if (data.addedCards && data.addedCards.length > 0) {
                    $('.js-gift-redeem-card-success').show();
                    setTimeout(function () {
                        $('.js-gift-redeem-card-success').hide();
                    }, 5000);
                    var cardArray = [];
                    var addedCardsHTML = '';
                    var removeBtnLabel=$('.added-cards').data('btn-label');
                    for (var i = 0; i < data.addedCards.length; i++) {
                        var card = data.addedCards[i];
                        addedCardsHTML += '<span class="added-card d-flex justify-content-between py-2 border-bottom w-100"><span>' + card.cardNo + '</span><span class="h-clr--green-2 h-fw--semibold">' + card.amount + '</span><span class="remove-giftcard-btn b-link--underlined" data-cardno="' + card.cardNo + '">' + removeBtnLabel + '</span></span>';
                    }
                    $('.added-cards').empty().append(addedCardsHTML);
                    $('#egift-number').val('');
                    $('#egift-pin').val('');
                    $('.giftcard-balance-text').empty();
                    if (data.noPendingAmount) {
                        $('.giftcard-full-redemption')
                            .empty()
                            .append(data.noPendingAmount).addClass('mt-4 p-2');
                        $('.add-giftcard-section').removeClass('show');
                        $('.add-giftcard-header').hide();
                        $('.payment-options-heading').hide();
                    }
                    if (data.success) {
                        $('.giftcard-partial-redemption')
                            .empty()
                            .append(data.success).addClass('mt-4 p-2');
                    }

                    if (data.basketModel && data.basketModel.totals) {
                        updateGiftPendingTotals(data.basketModel.totals);
                    }

                    if (data.hideAfterPay) {
                        if ($('.nav-link').hasClass('afterpay-tab')) {
                            $('.afterpay-tab').parent().hide();
                        }
                        // select another payment gateway if afterpay is not eligible
                        if ($('.nav-link.afterpay-tab').hasClass('active')) {
                            $('.payment-options .nav-item:not(.d-none)')
                                .eq(0)
                                .find('a')
                                .click(); // active another method
                        }
                        $('#afterpay-widget-container').hide();
                        $('.afterpay-widget').hide();
                    }

                    if (
                        !data.hideAfterPay &&
                        $('.nav-link').hasClass('afterpay-tab')
                    ) {
                        if (
                            data.basketModel.totals.pendingTotal &&
                            data.basketModel.totals.pendingTotal
                                .pendingAmountValue
                        ) {
                            $('#afterpay-widget-amount').val(
                                data.basketModel.totals.pendingTotal
                                    .pendingAmountValue
                            );
                            $('.afterpay-checkout-widget').find('square-placement').attr('data-amount', data.basketModel.totals.pendingTotal.pendingAmountValue);
                        }
                    }

                    if (data.hideCreditCardForm) {
                        $('#selectedPaymentOption').val('');
                        $('.form-nav.billing-nav.payment-information').hide();
                        $('.payment-method-options').hide();
                    }
                }
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop ();
                return false;
            }
        });
    });

    if ($('.same-day-delivery').is(':checked')) {
        $('.schedule-egift-months').addClass('d-none');
        $('.schedule-egift-date').addClass('d-none');
    }
    $('.same-day-delivery').on('change', function () {
        $('.schedule-egift-months').toggleClass('d-none');
        $('.schedule-egift-date').toggleClass('d-none');

        if ($(this).is(':checked')) {
            var date = new Date();
            var month = monthNames[date.getMonth()];
            $('#schedule-days-list').val(date.getDate()).trigger('change');
            $('#schedule-months-list').val(month).trigger('change');
        }
    });

    $(document).on('click', '.remove-giftcard-btn', function () {
        var url = $('input[name="remove-giftcard-url"]').val();
        var cardNumber = $(this).data('cardno');
        $.ajax({
            type: 'POST',
            url: url,
            data: { cardNumber: cardNumber },
            success: function (data) {
                if (data.error) {
                    if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                        return;
                    }
                    $('.giftcard-balance-wrap').empty();
                    $('.giftcard-balance-status-wrap').empty();
                } else if (data.remainingCards && data.remainingCards.length > 0) {
                    if (data.basketModel && data.basketModel.totals) {
                        updateGiftPendingTotals(data.basketModel.totals);
                    }
                    if (data.remainingCards) {
                        var addedCardsHTML = '';
                        var removeBtnLabel=$('.added-cards').data('btn-label');
                        for (var i = 0; i < data.remainingCards.length; i++) {
                            var card = data.remainingCards[i];
                            addedCardsHTML += '<span class="added-card d-flex justify-content-between py-2 border-bottom w-100"><span>' + card.cardNo + '</span><span class="h-clr--green-2 h-fw--semibold">' + card.amount + '</span><span class="remove-giftcard-btn b-link--underlined" data-cardno="' + card.cardNo + '">' + removeBtnLabel + '</span></span>';
                        }
                        $('.added-cards').empty().append(addedCardsHTML);
                        if (!data.hideCreditCardForm) {
                            $('.giftcard-full-redemption')
                                .empty().removeClass('mt-4 p-2');
                            $('.add-giftcard-section').addClass('show');
                            $('.add-giftcard-header').show();
                            $('.payment-options-heading').show();
                            $('.form-nav.billing-nav.payment-information').show();
                            $('.payment-method-options').show();
                        }
                        if (
                            !data.hideAfterPay &&
                            $('.nav-link').hasClass('afterpay-tab')
                        ) {
                            if (
                                data.basketModel.totals.pendingTotal &&
                                data.basketModel.totals.pendingTotal
                                    .pendingAmountValue
                            ) {
                                $('#afterpay-widget-amount').val(
                                    data.basketModel.totals.pendingTotal
                                        .pendingAmountValue
                                );
                                $('.afterpay-checkout-widget').find('square-placement').attr('data-amount', data.basketModel.totals.pendingTotal.pendingAmountValue);
                            }
                        }
                    }
                } else {
                    $('.added-cards').empty();
                    if (!data.hideCreditCardForm) {
                        $('.giftcard-full-redemption')
                            .empty().removeClass('mt-4 p-2');
                        $('.add-giftcard-section').addClass('show');
                        $('.add-giftcard-header').show();
                        $('.payment-options-heading').show();
                        $('.form-nav.billing-nav.payment-information').show();
                        $('.payment-method-options').show();
                    }
                    if (
                        !data.hideAfterPay &&
                        $('.nav-link').hasClass('afterpay-tab')
                    ) {
                        if (
                            data.basketModel.totals.pendingTotal &&
                            data.basketModel.totals.pendingTotal
                                .pendingAmountValue
                        ) {
                            $('#afterpay-widget-amount').val(
                                data.basketModel.totals.pendingTotal
                                    .pendingAmountValue
                            );
                            $('.afterpay-checkout-widget').find('square-placement').attr('data-amount', data.basketModel.totals.pendingTotal.pendingAmountValue);
                        }
                    }
                }
                $('.add-giftcard-header').show();
                if (data.basketModel && data.basketModel.totals) {
                    updateGiftPendingTotals(data.basketModel.totals);
                }
            },
            error: function () {
                return false;
            }
        });
    });

    $('#egift-card-check-balance').click(function (e) {
        e.preventDefault();
        var cardNumber = $('.gift-card-apply')
            // eslint-disable-next-line quotes
            .find("input:text[name='egift-number']")
            .val();
        var cardPin = $('.gift-card-apply')
            // eslint-disable-next-line quotes
            .find("input:text[name='egift-pin']")
            .val();
        var checkBalanceUrl = $('input[name=check-balance-url]').val();
        cardNumber = cardNumber.replace(/\s/g, '');
        var form = {
            cardNo: cardNumber,
            cardPin: cardPin
        };
        $.spinner().start();
        $.ajax({
            url: checkBalanceUrl,
            method: 'POST',
            data: form,
            success: function (data) {
                if (data.error) {
                    $('.gift-card-balance-error')
                        .empty()
                        .append(
                            '<span class="giftcard-balance-error h-clr--red">' +
                                data.errorMessage +
                                '</span>'
                        );
                    setTimeout(function () {
                        $('.giftcard-balance-error').remove();
                    }, 5000);
                } else {
                    $('.giftcard-balance-wrap')
                        .empty()
                        .append(
                            '<span class="giftcard-balance-text giftcard-balance-error">' +
                                data.cardBalance +
                                '</span>'
                        );
                    $('.giftcard-balance-status-wrap')
                        .empty()
                        .append(
                            '<span class="giftcard-balance-status-text giftcard-balance-error">Status: ' +
                                data.cardStatus +
                                '</span>'
                        );
                }
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
                return false;
            }
        });
    });


    $('body').on('click', '.gift-card-form .add-to-cart', function (e) {
        e.preventDefault(); // prevent default form submission
        var $form = $(this).closest('form');
        var $invalidFields = $form.find('input, select, textarea').filter(function() {
            return this.checkValidity() === false;
        });

        if ($invalidFields.length > 0) {
            var $firstInvalidField = $invalidFields.first();
            $('html, body').animate(
                {
                    scrollTop: $firstInvalidField.offset().top - 300
                },
                'slow'
            );
        } else {
            $(this).submit();
        }
    });


    $('.gift-card-form :input').blur(function () {
        var $this = $(this);
        var $errorMessage = $this.next('.invalid-feedback');
        if ($this[0].checkValidity()) {
            $errorMessage.hide();
            $this.removeClass('is-invalid');
        } else {
            var errorText;
            if ($this.val().length === 0) {
                errorText = $this.data('missing-error');
            } else {
                errorText = $this.data('pattern-mismatch');
            }
            $errorMessage.text(errorText).show();
        }
    });

    $('.add-giftcard-button').on('click', function () {
        $('.add-giftcard-section').addClass('show');
    });

    $('.giftcard-cancel-btn').on('click', function () {
        $('.add-giftcard-section').removeClass('show');
    });

    $(document).on('change', '#giftCard-video', function (evt) {
        if (this.files.length === 0) {
            return;
        }
        $('.giftcard-video').parent().find('.invalid-feedback').empty();
        if (this.files.length > 0 && (this.files[0].type || '').indexOf('video/') === -1) {
            $('.giftcard-video').parent().find('.invalid-feedback').text($('#giftCard-video').data('error-type'));
            evt.currentTarget.value = '';
            return;
        }

        if (this.files.length > 0 && this.files[0].size > 15728640) {
            $('.giftcard-video').parent().find('.invalid-feedback').text($('#giftCard-video').data('error-size'));
            evt.currentTarget.value = '';
            return;
        }
        $('.gift-card-video video').removeClass('d-none');
        $('.gift-card-video .remove-video').removeClass('d-none');
        $('.egift-video-label').addClass('d-none');
        var videoPreview = document.getElementById('video-preview');
        if (this.files[0]) {
            var videoURL = URL.createObjectURL(this.files[0]);
            videoPreview.src = videoURL;
        }
    });
});
