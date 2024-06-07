'use strict';

var layout = require('../utils/layout');
var detail = require('base/product/detail');
var base = require('./base');
var helpers = require('../utils/scrollHelpers');

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 * @returns {object} - Object with properties body and footer.
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.choice-of-bonus-product');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * Retrieves url to use when adding a product to the cart
 * @param {object} data - data object used to fill in dynamic portions of the html
 */
function chooseBonusProducts(data) {
    $('.modal-body').spinner().start();

    if ($('#chooseBonusProductModal').length !== 0) {
        $('#chooseBonusProductModal').remove();
    }
    var bonusUrl;
    if (data.bonusChoiceRuleBased) {
        bonusUrl = data.showProductsUrlRuleBased;
    } else {
        bonusUrl = data.showProductsUrlListBased;
    }

    var htmlString =
        '<!-- Modal -->' +
        '<div class="modal fade" id="chooseBonusProductModal" tabindex="-1" role="dialog">' +
        '<span class="enter-message sr-only" ></span>' +
        '<div class="modal-dialog choose-bonus-product-dialog" ' +
        'data-total-qty="' +
        data.maxBonusItems +
        '"' +
        'data-UUID="' +
        data.uuid +
        '"' +
        'data-pliUUID="' +
        data.pliUUID +
        '"' +
        'data-addToCartUrl="' +
        data.addToCartUrl +
        '"' +
        'data-pageStart="0"' +
        'data-pageSize="' +
        data.pageSize +
        '"' +
        'data-moreURL="' +
        data.showProductsUrlRuleBased +
        '"' +
        'data-bonusChoiceRuleBased="' +
        data.bonusChoiceRuleBased +
        '">' +
        '<!-- Modal content-->' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '    <span class="">' +
        data.labels.selectprods +
        '</span>' +
        '    <button type="button" class="close pull-right" data-dismiss="modal">' +
        '        <span aria-hidden="true">&times;</span>' +
        '        <span class="sr-only"> </span>' +
        '    </button>' +
        '</div>' +
        '<div class="modal-body"></div>' +
        '<div class="modal-footer"></div>' +
        '</div>' +
        '</div>' +
        '</div>';
    $('body').append(htmlString);
    $('.modal-body').spinner().start();

    $.ajax({
        url: bonusUrl,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            var parsedHtml = parseHtml(response.renderedTemplate);
            $('#chooseBonusProductModal .modal-body').empty();
            $('#chooseBonusProductModal .enter-message').text(
                response.enterDialogMessage
            );
            $('#chooseBonusProductModal .modal-header .close .sr-only').text(
                response.closeButtonText
            );
            $('#chooseBonusProductModal .modal-body').html(parsedHtml.body);
            $('#chooseBonusProductModal .modal-footer').html(parsedHtml.footer);
            $('#chooseBonusProductModal').modal('show');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success';
    // show add to cart toast
    if (
        response.newBonusDiscountLineItem &&
        Object.keys(response.newBonusDiscountLineItem).length !== 0
    ) {
        chooseBonusProducts(response.newBonusDiscountLineItem);
    } else {
        if ($('.add-to-cart-messages').length === 0) {
            $('body').append('<div class="add-to-cart-messages"></div>');
        }

        $('.add-to-cart-messages').append(
            '<div class="alert ' +
                messageType +
                ' add-to-basket-alert text-center" role="alert">' +
                response.message +
                '</div>'
        );

        setTimeout(function () {
            $('.add-to-basket-alert').remove();
        }, 5000);
    }
}



module.exports = $.extend({}, detail, {
    quantityUpdate: function () {
        $(document).on('click', '.quantity-field > .increase', function () {
            var maxOrderQty = Number($('input[name="maxOrderQty"]').val());
            var quantity = Number($(this).siblings('#Quantity').val());
            if (quantity === maxOrderQty) {
                $('.reserve-stock').removeClass('d-none');
            } else{
                quantity += 1;
                $(this).siblings('#Quantity').val(quantity).trigger('change');
                $(this).animate({ opacity: '0' }, 50, function () {
                    $(this).animate({ opacity: '1' }, 50);
                });
            }
        });

        $(document).on('click', '.quantity-field > .decrease', function () {
            var maxOrderQty = Number($('input[name="maxOrderQty"]').val());
            var quantity = Number($(this).siblings('#Quantity').val());
            if (quantity !== 1) {
                quantity -= 1;
                $(this).siblings('#Quantity').val(quantity).trigger('change');
            }
            if ( quantity <= maxOrderQty) {
                $('.reserve-stock').addClass('d-none');
            }
            $(this).animate({ opacity: '0' }, 50, function () {
                $(this).animate({ opacity: '1' }, 50);
            });
        });

        $(document).on('keyup', '.quantity-field > #Quantity', function () {
            var quantity = Number($(this).val());
            if (quantity < 0) {
                quantity = 1;
                $(this).val(quantity).trigger('change');
            }
            var maxOrderQty = Number($('input[name="maxOrderQty"]').val());
            if (quantity > maxOrderQty) {
                $(this).val(maxOrderQty).trigger('change');
                $('.reserve-stock').removeClass('d-none');
            } else {
                $('.reserve-stock').addClass('d-none');
            }
        });
        $(document).on('focusout', '.quantity-field > #Quantity', function () {
            var quantity = Number($(this).val());
            if (quantity < 1) {
                quantity = 1;
                $(this).val(quantity).trigger('change');
            }
        });
    },

    beforeAddToCartEventUpdate: function () {
        $('body').on('product:beforeAddToCart', function (e) {
            $.spinner().stop();
            e.stopPropagation();
        });
    },

    afterAddToCartEventUpdate: function () {
        $('body').on('product:afterAddToCart', function () {
            $('.reserve-stock').addClass('d-none');
        });
    },

    availability: base.availability,

    addToCart: base.addToCart,

    focusChooseBonusProductModal: base.focusChooseBonusProductModal(),

    removeEGiftCard: function () {
        $('.delete-egiftitem-confirmation-btn').on('click', function () {
            var productID = $(this).data('pid');
            var removeGiftPliUrl = $(this).data('action');
            var addToCartUrl = $(this).data('addtocarturl');
            var form = {
                pid: productID,
                quantity: 1
            };
            $.ajax({
                type: 'GET',
                url: removeGiftPliUrl,
                success: function () {
                    $.ajax({
                        type: 'POST',
                        url: addToCartUrl,
                        data: form,
                        success: function (data) {
                            handlePostCartAdd(data);
                            $('body').trigger('product:afterAddToCart', data);
                            $.spinner().stop();
                            base.miniCartReportingUrl(data.reportingURL);
                        },
                        error: function () {
                            $.spinner().stop();
                        }
                    });
                }
            });
        });
    },
    removeLineItem: function () {
        $('.delete-lineitem-confirmation-btn').on('click', function () {
            var productID = $(this).data('pid');
            var removeGiftPliUrl = $(this).data('action');
            var addToCartUrl = $(this).data('addtocarturl');
            var egiftCardDetailsObj;
            var egiftCardDetails = {
                senderName: $('.gift-card-form').find('input:text[name=\'sender-name\']').val(),
                recipientEmail: $('.gift-card-form').find('input#recipient-email').val(),
                recipientName: $('.gift-card-form').find('input:text[name=\'recipient-name\']').val(),
                eGiftMessage:  $('.gift-card-form').find('#egift-message').val(),
                eGiftScheduleDate: $('.gift-card-form').find('#schedule-days-list').val(),
                eGiftScheduleMonth: $('.gift-card-form').find('#schedule-months-list').val()
            };
            egiftCardDetailsObj = JSON.stringify(egiftCardDetails);
            var form = {
                pid: productID,
                quantity: 1,
                egiftCardDetails: egiftCardDetailsObj
            };
            $.ajax({
                type: 'GET',
                url: removeGiftPliUrl,
                success: function (data) {
                    $.ajax({
                        type: 'POST',
                        url: addToCartUrl,
                        data: form,
                        success: function () {
                            handlePostCartAdd(data);
                            $('body').trigger('product:afterAddToCart', data);
                            $.spinner().stop();
                            base.miniCartReportingUrl(data.reportingURL);
                        },
                        error: function () {
                            $.spinner().stop();
                        }
                    });
                }
            });
        });
    }
});

/** PDP Accordion */
$('.card:first').find('.title').removeClass('collapsed');
$('.card:first').find('.content').addClass('show');

/* Zoom Image */
$('.zoomImage-link, .carousel-item').on('click', function (e) {
    if (layout.isDesktop() || layout.isTablet()) {
        helpers.disableScroll();
        $('.zoomImage-sec').css('display', 'block');
    } else {
        e.preventDefault();
    }
});
$('.zoomOut-link').on('click', function () {
    helpers.enableScroll();
    $('.zoomImage-sec').css('display', 'none');
});
