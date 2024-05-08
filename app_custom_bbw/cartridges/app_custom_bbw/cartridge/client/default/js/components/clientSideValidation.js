'use strict';

/**
 * Validate whole form. Requires `this` to be set to form object
 * @param {jQuery.event} event - Event to be canceled if form is invalid.
 * @returns {boolean} - Flag to indicate if form is valid
 */
function validateForm(event) {
    var valid = true;
    if (this.checkValidity && !this.checkValidity()) {
        // safari
        valid = false;
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
        $(this).find('input, select').each(function () {
            if (!this.validity.valid) {
                $(this).trigger('invalid', this.validity);
            }
        });
    }
    return valid;
}

/**
 * Remove all validation. Should be called every time before revalidating form
 * @param {any} form - Form to be cleared
 * @returns {void}
 */
function clearForm(form) {
    $(form).find('.form-control.is-invalid').removeClass('is-invalid');
}

module.exports = {
    invalid: function () {
        $('form input, form select, form textarea').on('invalid', function (e) {
            e.preventDefault();
            this.setCustomValidity('');
            if (!this.validity.valid) {
                var validationMessage = this.validationMessage;
                $(this).addClass('is-invalid');
                if (this.validity.patternMismatch && $(this).data('pattern-mismatch')) {
                    validationMessage = $(this).data('pattern-mismatch');
                }
                if ((this.validity.rangeOverflow || this.validity.rangeUnderflow)
                    && $(this).data('range-error')) {
                    validationMessage = $(this).data('range-error');
                }
                if ((this.validity.tooLong || this.validity.tooShort)
                    && $(this).data('range-error')) {
                    validationMessage = $(this).data('range-error');
                }
                if (this.validity.valueMissing && $(this).data('missing-error')) {
                    validationMessage = $(this).data('missing-error');
                    // handling job form fields
                    if ($(this).parents('.form-control').hasClass('job-application')) {
                        if ($('#resume')[0].files.length === 0) {
                            $('#resume').addClass('is-invalid');
                            $('#resume').next('.invalid-feedback').text($('#resume').data('missing-error'));
                        } else {
                            $('#resume').removeClass('is-invalid');
                            $('#resume').next('.invalid-feedback').text('');
                        }
                    }
                }
                $(this).parents('.form-group').find('.invalid-feedback')
                    .text(validationMessage);

                for (var ele = 0; ele < $('#job').find('input').length; ele++) {
                    if ($('#job').find('input')[ele].value === '') {
                        $('html, body').animate({
                            scrollTop: $($('#job').find('input')[ele]).offset().top-100
                        }, 'slow');
                        return;
                    }
                }
            }
        });
    },

    submit: function () {
        $('form').on('submit', function (e) {
            return validateForm.call(this, e);
        });
    },

    buttonClick: function () {
        $('form button[type="submit"], form input[type="submit"]').on('click', function () {
            // clear all errors when trying to submit the form
            clearForm($(this).parents('form'));
        });
    },

    functions: {
        validateForm: function (form, event) {
            validateForm.call($(form), event || null);
        },
        clearForm: clearForm
    }
};
