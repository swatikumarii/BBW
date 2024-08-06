'use strict';

/**
 * Display error messages and highlight form fields with errors.
 * @param {string} parentSelector - the form which contains the fields
 * @param {object} fieldErrors - the fields with errors
 */
function loadFormErrors(parentSelector, fieldErrors) { // eslint-disable-line
    // Display error messages and highlight form fields with errors.
    $.each(fieldErrors, function (attr) {
        $('*[name=' + attr + ']', parentSelector)
            .addClass('is-invalid')
            .siblings('.invalid-feedback')
            .html(fieldErrors[attr]);
        $('*[name=' + attr + ']', parentSelector)
            .addClass('is-invalid')
            .siblings('.invalid-feedback')
            .removeAttr('style');
        var errorText;
        var $input = $('*[name=' + attr + ']', parentSelector);
        var $errorMessage = $input
            .parents('.iti')
            .siblings('.invalid-feedback');
        if ($input.val().length === 0) {
            errorText = $input.data('missing-error');
        } else {
            errorText = $input.data('pattern-mismatch');
        }
        if ($input.parents('.iti').length)
            $input.parents('.iti').addClass('is-invalid border-danger');
        $errorMessage.text(errorText).show();
    });
    var form = $(parentSelector).closest('form');
    setTimeout(function () {
        var element = form.find(
            '.form-control.is-invalid, .selectric-form-control.is-invalid'
        );
        if (element && element.length) {
            $('body,html').animate(
                {
                    scrollTop: element.offset().top - 250
                },
                500
            );
        }
    }, 100);
}

/**
 * Clear the form errors.
 * @param {string} parentSelector - the parent form selector.
 */
function clearPreviousErrors(parentSelector) {
    $(parentSelector).find('.form-control.is-invalid').removeClass('is-invalid');
    $('.error-message').hide();
}

module.exports = {
    loadFormErrors: loadFormErrors,
    clearPreviousErrors: clearPreviousErrors
};
