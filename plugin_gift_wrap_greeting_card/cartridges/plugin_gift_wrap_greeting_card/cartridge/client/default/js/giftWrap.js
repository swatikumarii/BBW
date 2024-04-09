'use strict';

/**
 * re-renders the order totals and the number of items in the cart
 * @param {object} message - Error message to display
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
 * This function will validate add form
 * @param {number} pid - Product Id
 * @param {string} giftWrapType - Gift Wrap Type
 * @param {number[]} toBeIndividuallyWrappedPids - Individual wrappable product ids
 * @returns {boolean} - If any error found then return false else true
 */
function validate(pid, giftWrapType, toBeIndividuallyWrappedPids) {
    var isValid = true;
    if (!pid) {
        createErrorNotification('PID select');
        isValid = false;
    } else if (
        !giftWrapType ||
        !(giftWrapType === 'INDIVIDUAL' || giftWrapType === 'TOGETHER')
    ) {
        createErrorNotification('GWT select');
        isValid = false;
    } else if (giftWrapType === 'INDIVIDUAL') {
        document
            .querySelectorAll('input[name=individual-lineItem]:checked')
            .forEach(function (element) {
                toBeIndividuallyWrappedPids.push(element.value);
            });
        if (toBeIndividuallyWrappedPids.length === 0) {
            createErrorNotification(
                'toBeIndividuallyWrappedPids select'
            );
            isValid = false;
        }
    }
    return isValid;
}
/**
 * add gift wrap product to cart
 */
function addGiftWrapToCart() {
    var pid = $('input[name="gift-wrap-product"]:checked').val();
    var addToCartUrl = $('#addGiftWrapProduct').attr('data-actionurl');
    var giftWrapType = $('input[name="giftwrap-type"]:checked').val();
    var toBeIndividuallyWrappedPids = [];

    if (validate(pid, giftWrapType, toBeIndividuallyWrappedPids)) {
        var quantity = toBeIndividuallyWrappedPids.length || 1;
        var form = {
            pid: pid,
            quantity: quantity,
            giftWrapType: giftWrapType,
            toBeIndividuallyWrappedPids: JSON.stringify(
                toBeIndividuallyWrappedPids
            )
        };
        $('#addGiftWrapProduct').trigger('updateAddToCartFormData', form);
        if (addToCartUrl) {
            $.ajax({
                url: addToCartUrl,
                method: 'POST',
                data: form,
                success: function () {
                    window.location.reload();
                }
            });
        }
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

        var checkallCheckbox = this.checked;

        // Iterate through each checkbox and set its checked property to true
        checkboxes.forEach(function (cb) {
            cb.checked = checkallCheckbox;
        });
    });

    // click event to handle add to cart functionality for gift wrap
    $(document).on('click', '#addGiftWrapProduct', function () {
        addGiftWrapToCart();
    });
});
