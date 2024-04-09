'use strict';

/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml =
        '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' +
        message +
        '</div>';

    $('.cart-error').append(errorHtml);
}

/**
 * add gift wrap product to cart
 */
function addGiftWrapToCart() {
    var pid = $('input[name="gift-wrap-product"]:checked').val();
    var addToCartUrl = $('#addGiftWrapProduct').attr('data-actionurl');
    var giftWrapType = $('input[name="giftwrap-type"]:checked').val();
    var toBeIndividuallyWrappedPids = [];

    if (!pid) {
        return createErrorNotification('PID select');
    } else if (
        !giftWrapType ||
        !(giftWrapType === 'INDIVIDUAL' || giftWrapType === 'TOGETHER')
    ) {
        return createErrorNotification('GWT select');
    } else if (giftWrapType === 'INDIVIDUAL') {
        document
            .querySelectorAll('input[name=individual-lineItem]:checked')
            .forEach((element) => {
                toBeIndividuallyWrappedPids.push(element.value);
            });
        if (toBeIndividuallyWrappedPids.length == 0) {
            return createErrorNotification(
                'toBeIndividuallyWrappedPids select'
            );
        }
    }
    var quantity = toBeIndividuallyWrappedPids.length || 1;
    var form = {
        pid: pid,
        quantity: quantity,
        giftWrapType: giftWrapType,
        toBeIndividuallyWrappedPids: JSON.stringify(toBeIndividuallyWrappedPids)
    };
    $('#addGiftWrapProduct').trigger('updateAddToCartFormData', form);
    if (addToCartUrl) {
        $.ajax({
            url: addToCartUrl,
            method: 'POST',
            data: form,
            success: function (data) {
                window.location.reload();
            }
        });
    }
}

/**
 * On ready
 */
$(document).ready(function () {
    $(document).on('change', 'input[name=individual-lineItem]', function () {
        if (this.checked) {
            if (
                $('input[name=individual-lineItem]:checked').length ===
                $('.giftservice-products').children().length
            ) {
                document.querySelector(
                    'input[type="checkbox"][name=checkall]'
                ).checked = true;
            }
        } else {
            document.querySelector(
                'input[type="checkbox"][name=checkall]'
            ).checked = false;
        }
    });

    // click event to add and save all product details in individual wrapping functionality when select all is selected
    $(document).on('change', '#checkall', function () {
        // Get all checkboxes with the specified name
        var checkboxes = document.querySelectorAll(
            'input[type="checkbox"][name=individual-lineItem]'
        );

        let checkallCheckbox = this.checked;

        // Iterate through each checkbox and set its checked property to true
        checkboxes.forEach(function (checkbox) {
            checkbox.checked = checkallCheckbox;
        });
    });

    // click event to handle add to cart functionality for gift wrap
    $(document).on('click', '#addGiftWrapProduct', function () {
        addGiftWrapToCart();
    });
});
