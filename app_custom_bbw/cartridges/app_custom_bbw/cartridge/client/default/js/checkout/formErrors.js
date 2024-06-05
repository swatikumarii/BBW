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
