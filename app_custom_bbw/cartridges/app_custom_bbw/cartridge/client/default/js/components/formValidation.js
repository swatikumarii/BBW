'use strict';

/**
 * Remove all validation. Should be called every time before revalidating form
 * @param {object} form - Form to be cleared
 * @returns {void}
 */
function clearFormErrors(form) {
    $(form).find('.form-control.is-invalid').removeClass('is-invalid');
}

module.exports = function (formElement, payload) {
    // clear form validation first
    clearFormErrors(formElement);
    $('.alert', formElement).remove();

    if (typeof payload === 'object' && payload.fields) {
        Object.keys(payload.fields).forEach(function (key) {
            var isSelectric = false;
            if (payload.fields[key]) {
                var feedbackElement = $(formElement).find('[name="' + key + '"]')
                    .parent()
                    .children('.invalid-feedback');
                if ($(formElement).find('[name="' + key + '"]').hasClass('selectric-dropdown')) {
                    feedbackElement = $(formElement).find('[name="' + key + '"]').parents('.selectric-wrapper').parent().children('.invalid-feedback');
                    isSelectric = true;
                }

                if (feedbackElement.length > 0) {
                    if (Array.isArray(payload[key])) {
                        feedbackElement.html(payload.fields[key].join('<br/>'));
                    } else {
                        feedbackElement.html(payload.fields[key]);
                    }
                    if (isSelectric) {
                        feedbackElement.siblings('.selectric-form-control').addClass('is-invalid');
                    } else {
                        feedbackElement.siblings('.form-control').addClass('is-invalid');
                    }
                }
            }
        });
    }
    var element = $(formElement).find(
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
    if (payload && payload.error) {
        var form = $(formElement).prop('tagName') === 'FORM'
            ? $(formElement)
            : $(formElement).parents('form');

        form.prepend('<div class="alert alert-danger" role="alert">'
            + payload.error.join('<br/>') + '</div>');
    }
};
