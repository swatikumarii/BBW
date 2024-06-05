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
    $('#giftcardAmount').show();
    $('#giftcardAmount .gifcard-amount')
        .empty()
        .text(totals.pendingTotal.giftTotal);
    // update order total
    if (totals.orderTotal) {
        $('.order-total-sum').empty().append(totals.orderTotal);
        $('.order-total').removeClass('d-none');
    } else {
        $('.order-total').addClass('d-none');
    }
}

/**
 * Price Update AfterPay Widget
 */
function updateAfterPayWidget() {
    if ($('#afterpay-widget-amount').val() > 0) {
        // eslint-disable-next-line no-undef
        // afterpayWidget.update({
        //     amount: {
        //         amount: $('#afterpay-widget-amount').val(),
        //         currency: $('#afterpay-widget-currency').val()
        //     }
        // });
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
                    $('.gift-redeem-card-error')
                        .empty()
                        .append(
                            '<span class="giftcard-redeem-error">' +
                                data.errorMessage +
                                '</span>'
                        );
                    setTimeout(function () {
                        $('.giftcard-redeem-error').remove();
                    }, 5000);

                    $('.giftcard-balance-wrap').empty();
                    $('.giftcard-balance-status-wrap').empty();
                } else if (data.addedCards && data.addedCards.length > 0) {
                    var cardArray = [];
                    for (var i = 0; i < data.addedCards.length; i++) {
                        var card = data.addedCards[i];
                        cardArray.push(card);
                        $('.giftcard-redeemed-cardnumber-' + i)
                            .empty()
                            .append(card);
                        $('.redeemed-card-' + i).show();
                        $('.giftcard-redeemed-cardnumber-' + i).show();
                        $('.remove-card-' + i).attr('data-cardno', card);
                    }
                    if (data.noPendingAmount) {
                        $('.gift-redeem-card-status')
                            .empty()
                            .append(data.noPendingAmount);
                    }
                    if (data.success) {
                        $('.gift-redeem-card-status')
                            .empty()
                            .append(
                                '<span class="giftcard-redeem-success">' +
                                    data.success +
                                    '</span>'
                            );
                        setTimeout(function () {
                            $('.giftcard-redeem-success').remove();
                        }, 8000);
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
                        }
                        updateAfterPayWidget();
                    }

                    if (data.hideCreditCardForm) {
                        $('#selectedPaymentOption').val('');
                        $('.form-nav.billing-nav.payment-information').hide();
                        $('#paymentMethodsList').hide();
                    }
                }
            },
            error: function () {
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
        $.ajax({
            url: checkBalanceUrl,
            method: 'POST',
            data: form,
            success: function (data) {
                if (data.error) {
                    $('.gift-card-balance-error')
                        .empty()
                        .append(
                            '<span class="giftcard-balance-error">' +
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
                            '<span class="giftcard-balance-text giftcard-balance-error">Balance: ' +
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
            },
            error: function () {
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
