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
 * @param {Array} form - Form to be cleared
 * @returns {void}
 */
function clearForm(form) {
    $(form).find('.form-control.is-invalid').removeClass('is-invalid');
    $(form).find('.iti--allow-dropdown.is-invalid').removeClass('is-invalid');
}

/**
 * Updated the function to check invalid form
 */
function invalid() {
    $('form input, form select, form textarea').on('invalid', function (e) {
        e.preventDefault();
        this.setCustomValidity('');
        if (!this.validity.valid) {
            var validationMessage = this.validationMessage;
            $(this).addClass('is-invalid');
            if ($(this).hasClass('iti__tel-input')) {
                $(this).closest('.iti--allow-dropdown').addClass('is-invalid');
            }
            if (
                this.validity.patternMismatch &&
                    $(this).data('pattern-mismatch')
            ) {
                validationMessage = $(this).data('pattern-mismatch');
            }
            if (
                this.validity.typeMismatch &&
                $(this).data('pattern-mismatch')
            ) {
                validationMessage = $(this).data('pattern-mismatch');
            }
            if (
                (this.validity.rangeOverflow ||
                        this.validity.rangeUnderflow) &&
                    $(this).data('range-error')
            ) {
                validationMessage = $(this).data('range-error');
            }
            if (
                (this.validity.tooLong || this.validity.tooShort) &&
                    $(this).data('range-error')
            ) {
                validationMessage = $(this).data('range-error');
            }
            if (
                this.validity.valueMissing &&
                    $(this).data('missing-error')
            ) {
                validationMessage = $(this).data('missing-error');
                // handling job form fields
                if (
                    $(this)
                        .parents('.form-control')
                        .hasClass('job-application')
                ) {
                    if ($('#resume')[0].files.length === 0) {
                        $('#resume').addClass('is-invalid');
                        $('#resume')
                            .next('.invalid-feedback')
                            .text($('#resume').data('missing-error'));
                    } else {
                        $('#resume').removeClass('is-invalid');
                        $('#resume').next('.invalid-feedback').text('');
                    }
                }
            }

            var form = $(this).closest('form.edit-profile-form');
            if (form.length > 0) {
                if (validationMessage) {
                    $('.submit-edit-profile').addClass('disabled');
                } else {
                    $('.submit-edit-profile').removeClass('disabled');
                }
            }

            $(this)
                .parents('.form-group')
                .find('.invalid-feedback')
                .text(validationMessage);

            for (var ele = 0; ele < $('#job').find('input').length; ele++) {
                if ($('#job').find('input')[ele].value === '') {
                    $('html, body').animate(
                        {
                            scrollTop:
                                    $($('#job').find('input')[ele]).offset()
                                        .top - 100
                        },
                        'slow'
                    );
                    return;
                }
            }
        }
    });
}

module.exports = {
    invalid: function () {
        invalid();

        $('body').on('form:invalid',
            function () {
                invalid();
            }
        );
    },

    submit: function () {
        $('form').on('submit', function (e) {
            return validateForm.call(this, e);
        });
    },

    buttonClick: function () {
        $('body').on('click', 'form button[type="submit"], form input[type="submit"]', function () {
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
