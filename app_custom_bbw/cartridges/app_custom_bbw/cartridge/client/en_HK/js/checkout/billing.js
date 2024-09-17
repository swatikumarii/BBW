'use strict';

var addressHelpers = require('./address');
var cleave = require('base/components/cleave');

/**
 * updates the billing address selector within billing forms
 * @param {object} order - the order model
 * @param {object} customer - the customer model
 */
function updateBillingAddressSelector(order, customer) {
    var shippings = order.shipping;

    var form = $('form[name$=billing]')[0];
    var $billingAddressSelector = $('.addressSelector', form);
    var hasSelectedAddress = false;

    if ($billingAddressSelector && $billingAddressSelector.length === 1) {
        $billingAddressSelector.empty();
        // Add New Address option
        $billingAddressSelector.append(
            addressHelpers.methods.optionValueForAddress(null, false, order, {
                type: 'billing'
            })
        );

        // Separator -
        $billingAddressSelector.append(
            addressHelpers.methods.optionValueForAddress(
                order.resources.shippingAddresses,
                false,
                order,
                {
                    // className: 'multi-shipping',
                    type: 'billing'
                }
            )
        );

        shippings.forEach(function (aShipping) {
            var isSelected = order.billing.matchingAddressId === aShipping.UUID;
            hasSelectedAddress = hasSelectedAddress || isSelected;
            // Shipping Address option
            $billingAddressSelector.append(
                addressHelpers.methods.optionValueForAddress(
                    aShipping,
                    isSelected,
                    order,
                    {
                        // className: 'multi-shipping',
                        type: 'billing'
                    }
                )
            );
        });

        if (customer.addresses && customer.addresses.length > 0) {
            $billingAddressSelector.append(
                addressHelpers.methods.optionValueForAddress(
                    order.resources.accountAddresses,
                    false,
                    order
                )
            );
            customer.addresses.forEach(function (address) {
                var isSelected = order.billing.matchingAddressId === address.ID;
                hasSelectedAddress = hasSelectedAddress || isSelected;
                // Customer Address option
                $billingAddressSelector.append(
                    addressHelpers.methods.optionValueForAddress(
                        {
                            UUID: 'ab_' + address.ID,
                            shippingAddress: address
                        },
                        isSelected,
                        order,
                        { type: 'billing' }
                    )
                );
            });
        }
    }

    if (
        hasSelectedAddress ||
        (!order.billing.matchingAddressId &&
            order.billing.billingAddress.address)
    ) {
        // show
        $(form).attr('data-address-mode', 'edit');
    } else {
        $(form).attr('data-address-mode', 'new');
    }

    $billingAddressSelector.show();
}

/**
 * Updates the billing address form values within payment forms without any payment instrument validation
 * @param {object} order - the order model
 */
function updateBillingAddress(order) {
    var billing = order.billing;
    if (!billing.billingAddress || !billing.billingAddress.address) return;

    var form = $('form[name=dwfrm_billing]');
    if (!form) return;

    $('input[name$=_firstName]', form).val(
        billing.billingAddress.address.firstName
    );
    $('input[name$=_lastName]', form).val(
        billing.billingAddress.address.lastName
    );
    $('input[name$=_address1]', form).val(
        billing.billingAddress.address.address1
    );
    $('input[name$=_address2]', form).val(
        billing.billingAddress.address.address2
    );
    $('select[name$=_stateCode],input[name$=_stateCode]', form).val(
        billing.billingAddress.address.stateCode
    );
    $('select[name$=_city],input[name$=_city]', form).val(
        billing.billingAddress.address.city
    );
    $('select[name$=_postalCode],input[name$=_postalCode]', form).val(
        billing.billingAddress.address.postalCode
    );
    $('select[name$=_country]', form).val(
        billing.billingAddress.address.countryCode.value
    );
    $('input[name$=_phone]', form).val(billing.billingAddress.address.phone);
    $('input[name$=_email]', form).val(order.orderEmail);
}

/**
 * Validate and update payment instrument form fields
 * @param {object} order - the order model
 */
function validateAndUpdateBillingPaymentInstrument(order) {
    var billing = order.billing;
    if (
        !billing.payment ||
        !billing.payment.selectedPaymentInstruments ||
        billing.payment.selectedPaymentInstruments.length <= 0
    )
        return;

    var form = $('form[name=dwfrm_billing]');
    if (!form) return;

    var instrument = billing.payment.selectedPaymentInstruments[0];
    $('select[name$=expirationMonth]', form).val(instrument.expirationMonth);
    $('select[name$=expirationYear]', form).val(instrument.expirationYear);
    // Force security code and card number clear
    $('input[name$=securityCode]', form).val('');
    if ($('input[name$=cardNumber]').data('cleave')) {
        $('input[name$=cardNumber]').data('cleave').setRawValue('');
    }
}

/**
 * Updates the billing address form values within payment forms
 * @param {object} order - the order model
 */
function updateBillingAddressFormValues(order) {
    module.exports.methods.updateBillingAddress(order);
    module.exports.methods.validateAndUpdateBillingPaymentInstrument(order);
}

/**
 * clears the billing address form values
 */
function clearBillingAddressFormValues() {
    updateBillingAddressFormValues({
        billing: {
            billingAddress: {
                address: {
                    countryCode: {}
                }
            }
        }
    });
}

/**
 * update billing address summary and contact information
 * @param {object} order - checkout model to use as basis of new truth
 */
function updateBillingAddressSummary(order) {
    // update billing address summary
    addressHelpers.methods.populateAddressSummary(
        '.billing .address-summary',
        order.billing.billingAddress.address
    );
    addressHelpers.methods.populateAddressSummary(
        '.billing-address-block .summary-details.billing',
        order.billing.billingAddress.address
    );

    // update billing parts of order summary
    $('.order-summary-email').text(order.orderEmail);

    if (order.billing.billingAddress.address) {
        $('.order-summary-phone').text(
            order.billing.billingAddress.address.phone
        );
    }
}

/**
 * Updates the billing information in checkout, based on the supplied order model
 * @param {object} order - checkout model to use as basis of new truth
 * @param {object} customer - customer model to use as basis of new truth
 */
function updateBillingInformation(order, customer) {
    updateBillingAddressSelector(order, customer);

    // update billing address form
    updateBillingAddressFormValues(order);

    // update billing address summary and billing parts of order summary
    updateBillingAddressSummary(order);
}

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
    // update payment details
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';
    var giftcards = false;
    var giftcardsAmount = 0;

    if (
        order.billing.payment &&
        order.billing.payment.selectedPaymentInstruments &&
        order.billing.payment.selectedPaymentInstruments.length > 0
    ) {
        order.billing.payment.selectedPaymentInstruments.forEach(function (selectedPaymentInstrument) {
            if (selectedPaymentInstrument.paymentMethod === 'CREDIT_CARD' || selectedPaymentInstrument.paymentMethod === 'AdyenComponent') {
                if (selectedPaymentInstrument.type) {
                    htmlToAppend +=
                        '<span>'+
                         order.resources.cardType +
                        ' ' +
                        selectedPaymentInstrument.type+
                        '</span>'+
                        '<div>' +
                            selectedPaymentInstrument.maskedCreditCardNumber +
                        '</div>';
                } else if (selectedPaymentInstrument.selectedAdyenPM) {
                    htmlToAppend +=
                        '<span>'+
                        selectedPaymentInstrument.selectedAdyenPM +
                        '</span>';
                }
                htmlToAppend +='<div class="payment-amount h-fw--semibold">'+
                    '<span class="label h-clr--black-1">'+
                    (order.currencyCode ? order.currencyCode :'') + ' ' + selectedPaymentInstrument.amount+
                    '</span>'+
                    '</div>';
            } else if (selectedPaymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
                giftcards = true;
                giftcardsAmount += selectedPaymentInstrument.amount;
            }
        });
        if (giftcards) {
            htmlToAppend += '<div class="mt-2">Gift Card</div>'+
                '<div class="payment-amount h-fw--semibold mb-3">'+
                '<span class="label h-clr--black-1">'+
                (order.currencyCode ? order.currencyCode :'') + ' ' + giftcardsAmount+
                '</span>'+
                '</div>';
        }
    }
    $paymentSummary.empty().append(htmlToAppend);
}

/**
 * clears the credit card form
 */
function clearCreditCardForm() {
    $('input[name$="_cardNumber"]').data('cleave').setRawValue('');
    $('select[name$="_expirationMonth"]').val('');
    $('select[name$="_expirationYear"]').val('');
    $('input[name$="_securityCode"]').val('');
}

module.exports = {
    methods: {
        updateBillingAddressSelector: updateBillingAddressSelector,
        updateBillingAddressFormValues: updateBillingAddressFormValues,
        clearBillingAddressFormValues: clearBillingAddressFormValues,
        updateBillingInformation: updateBillingInformation,
        updatePaymentInformation: updatePaymentInformation,
        clearCreditCardForm: clearCreditCardForm,
        updateBillingAddress: updateBillingAddress,
        validateAndUpdateBillingPaymentInstrument:
            validateAndUpdateBillingPaymentInstrument,
        updateBillingAddressSummary: updateBillingAddressSummary
    },

    showBillingDetails: function () {
        $('.btn-show-billing-details').on('click', function () {
            $(this)
                .parents('[data-address-mode]')
                .attr('data-address-mode', 'new');
        });
    },

    hideBillingDetails: function () {
        $('.btn-hide-billing-details').on('click', function () {
            $(this)
                .parents('[data-address-mode]')
                .attr('data-address-mode', 'details');
        });
    },

    selectBillingAddress: function () {
        $('.payment-form .addressSelector').on('change', function () {
            var form = $(this).parents('form')[0];
            var selectedOption = $('option:selected', this);
            var optionID = selectedOption[0].value;

            if (optionID === 'new') {
                // Show Address
                $(form).attr('data-address-mode', 'new');
            } else {
                // Hide Address
                $(form).attr('data-address-mode', 'details');
            }

            // Copy fields
            var attrs = selectedOption.data();
            var element;
            var stateCode = attrs.stateCode.trim();
            var city = attrs.city.trim();
            var subDistrict = attrs.subdistrict.trim();
            var dialCodeCountry = attrs.dialCodeCountry;
            if (stateCode) {
                $('.billingState option').removeAttr('selected');
                $('.billingState').append(
                    $('<option>', {
                        value: stateCode,
                        text: stateCode
                    }).attr('selected', 'selected')
                );
                $('.billingState').trigger('change');
                $('.billingState option').each(function () {
                    if ($(this).val() === stateCode) {
                        $('.billingState option').removeAttr('selected');
                        $(this).attr('selected', 'selected');
                        $('body').find('.billingState').trigger('change');
                        return false;
                    }
                });
            } else {
                $('.billingState option').removeAttr('selected');
                $('.billingState').val('').trigger('change');
                $('.billingAddressCity').val('');
                $('.billingAddressSubdistrict').val('');
            }
            if (city) {
                $('.billingAddressCity').prepend(
                    $('<option></option>')
                        .attr('value', '')
                        .attr('selected', 'selected')
                );
                $('.billingAddressCity option').each(function () {
                    if ($(this).val() === city) {
                        $('.billingAddressCity option').removeAttr('selected');
                        $('.billingAddressCity option')[0].remove();
                        $(this).attr('selected', 'selected');
                        $('body').find('.billingAddressCity').trigger('change');
                        return false;
                    }
                });
            }
            if (subDistrict) {
                $('.billingAddressSubdistrict option').each(function () {
                    if ($(this).val() === subDistrict) {
                        $('.billingAddressSubdistrict option').removeAttr('selected');
                        $(this).attr('selected', 'selected');
                        return false;
                    }
                });
            }
            if (dialCodeCountry) {
                // Get the instance of intl-tel-input
                if (window.billingInstance) {
                    window.billingInstance.setCountry(dialCodeCountry);
                }
            }

            Object.keys(attrs).forEach(function (attr) {
                if (
                    ![
                        'stateCode',
                        'city',
                        'postalCode',
                        'countryCode',
                        'district'
                    ].includes(attr)
                ) {
                    element = attr === 'countryCode' ? 'country' : attr;
                    var $input = $('[name$=' + element + ']', form);
                    if ($input.length === 0 && element === 'subdistrict') {
                        $input = $('[name$=subDistrict]', form);
                    }
                    if (element === 'cardNumber') {
                        $('.cardNumber')
                            .data('cleave')
                            .setRawValue(attrs[attr]);
                    } else {
                        $('[name$=' + element + ']', form).val(attrs[attr]);
                    }
                    // validate an hide/show errors
                    var $errorMessage = $input.next('.invalid-feedback');
                    if ($input[0].checkValidity()) {
                        $errorMessage.hide();
                        $input.removeClass('is-invalid');
                    } else {
                        var errorText;
                        if ($input.val().length === 0) {
                            errorText = $input.data('missing-error');
                        } else {
                            errorText = $input.data('pattern-mismatch');
                        }
                        $errorMessage.text(errorText).show(); // Use the title attribute or customize the message
                    }
                }
            });
        });
    },

    handleCreditCardNumber: function () {
        cleave.handleCreditCardNumber('.cardNumber', '#cardType');
    },

    santitizeForm: function () {
        $('body').on('checkout:serializeBilling', function (e, data) {
            var serializedForm = cleave.serializeData(data.form);

            data.callback(serializedForm);
        });
    },

    selectSavedPaymentInstrument: function () {
        $(document).on('click', '.saved-payment-instrument', function (e) {
            e.preventDefault();
            $('.saved-payment-security-code').val('');
            $('.saved-payment-instrument').removeClass('selected-payment');
            $(this).addClass('selected-payment');
            $('.saved-payment-instrument .card-image').removeClass(
                'checkout-hidden'
            );
            $('.saved-payment-instrument .security-code-input').addClass(
                'checkout-hidden'
            );
            $(
                '.saved-payment-instrument.selected-payment .card-image'
            ).addClass('checkout-hidden');
            $(
                '.saved-payment-instrument.selected-payment ' +
                    '.security-code-input'
            ).removeClass('checkout-hidden');
        });
    },

    addNewPaymentInstrument: function () {
        $('.btn.add-payment').on('click', function (e) {
            e.preventDefault();
            $('.payment-information').data('is-new-payment', true);
            clearCreditCardForm();
            $('.credit-card-form').removeClass('checkout-hidden');
            $('.user-payment-instruments').addClass('checkout-hidden');
        });
    },

    cancelNewPayment: function () {
        $('.cancel-new-payment').on('click', function (e) {
            e.preventDefault();
            $('.payment-information').data('is-new-payment', false);
            clearCreditCardForm();
            $('.user-payment-instruments').removeClass('checkout-hidden');
            $('.credit-card-form').addClass('checkout-hidden');
        });
    },

    clearBillingForm: function () {
        $('body').on('checkout:clearBillingForm', function () {
            clearBillingAddressFormValues();
        });
    },

    paymentTabs: function () {
        $('.payment-options .nav-item').on('click', function (e) {
            e.preventDefault();
            var methodID = $(this).data('method-id');
            $('.payment-information').data('payment-method-id', methodID);
        });
    },

    editBillingAddress: function () {
        $('.edit-billing-address').on('click', function () {
            $(this).parents('form').attr('data-address-mode', 'details');
            $(this).parents('.summary-details.billing').slideUp();
            var billingAddrSummary = $(this).siblings('.address-summary');
            var stateCode = billingAddrSummary.find('.stateCode').text().trim();
            var city = billingAddrSummary.find('.city').text().trim().replace(',','');
            var subDistrict = billingAddrSummary.find('.subDistrict').text().trim().replace(',', '');
            if (stateCode !== 'null') {
                var exists = false;
                $('.billingState option').each(function () {
                    if ($(this).val() === stateCode) {
                        $('.billingState option').removeAttr('selected');
                        $(this).attr('selected', 'selected');
                        $('body').find('.billingState').trigger('change');
                        exists = true;
                        return false;
                    }
                });
                if (!exists) {
                    var billingState = $('.billingState');
                    billingState.empty();
                    billingState
                        .prepend(
                            $('<option>', {
                                value: stateCode,
                                text: stateCode
                            })
                        )
                        .attr('selected', 'selected');
                }
            }
            if (city !== 'null') {
                var cityExists = false;
                $('.billingAddressCity option').each(function () {
                    if ($(this).val() === city) {
                        $('.billingAddressCity option').removeAttr('selected');
                        $(this).attr('selected', 'selected');
                        $('body').find('.billingAddressCity').trigger('change');
                        cityExists = true;
                        return false;
                    }
                });
                if (!cityExists) {
                    var billingAddressCity = $('.billingAddressCity');
                    billingAddressCity.empty();
                    billingAddressCity
                        .prepend(
                            $('<option>', {
                                value: city,
                                text: city
                            })
                        )
                        .attr('selected', 'selected');
                    $('.billingAddressCity').removeClass('is-invalid');
                }
            }
            if (subDistrict !== 'null') {
                var subDisExists = false;
                $('.billingAddressSubdistrict option').each(function () {
                    if ($(this).val() === subDistrict) {
                        $('.billingAddressSubdistrict option').removeAttr(
                            'selected'
                        );
                        $(this).attr('selected', 'selected');
                        $('body')
                            .find('.billingAddressSubdistrict')
                            .trigger('change');
                        subDisExists = true;
                        return false;
                    }
                });
                if (!subDisExists) {
                    var billingAddressSubdistrict = $(
                        '.billingAddressSubdistrict'
                    );
                    billingAddressSubdistrict.empty();
                    billingAddressSubdistrict
                        .prepend(
                            $('<option>', {
                                value: subDistrict,
                                text: subDistrict
                            })
                        )
                        .attr('selected', 'selected');
                    $('.billingAddressSubdistrict').removeClass('is-invalid');
                }
            }
        });
    }
};
