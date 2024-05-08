'use strict';

var formValidation = require('base/components/formValidation');

$('body').on('click', '.applicationButton', function (e) {
    e.preventDefault();
    $('.jobForm').slideToggle();
});

/**
 * Function to use validate fields
 * @param {any} inputField input field
 * @returns {boolean} true/false
 */
function validateField(inputField) {
    var errorElement = $('#' + inputField.attr('id') + '-error');
    if (!inputField.val()) {
        inputField.addClass('is-invalid'); // Add class for input border error
        errorElement.text('Field is required'); // Display error message
        return false;
    }
    inputField.removeClass('is-invalid'); // Remove class if input is valid
    return true;
}

/**
 * Function to scroll to the top of the page
 */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

module.exports = {
    register: function () {
        $('.job-application').submit(function (e) {
            e.preventDefault();
            var form = $(this);

            var url = form.attr('action');
            var formData = new FormData();
            var fileUpload = $('#resume').get(0);
            var files = fileUpload.files;
            $('.large-size-msg').css('display', 'none');
            $('.thankyou-msg').css('display', 'none');
            $('.error-msg-jobs').css('display', 'none');
            // resume validate
            $('.wrong-file-type-msg').css('display', 'none');

            // Looping over all files and add them to FormData object
            if ($('#resume')[0].files.length === 0) {
                $('form button[type="submit"]').spinner().stop();
                $('.fileInputTypeFormError').removeClass('d-none');
                $('.form-file-control').addClass('is-invalid');
                scrollToTop(); // Scroll to top if error occurs
                return false;
            }

            var ext = files[0].name.substring(files[0].name.lastIndexOf('.') + 1);
            if (ext !== 'pdf' && ext !== 'doc' && ext !== 'docx') {
                $('.form-file-control').addClass('is-invalid');
                $('.fileInputTypeFormError').addClass('d-none');

                $('.wrong-file-type-msg').css('display', 'block');
                $('.noFileSupport').removeClass('d-none');
                scrollToTop(); // Scroll to top if error occurs
                return false;
            }

            $('#resume').next('.invalid-feedback').text('');
            $('.form-file-control').removeClass('is-invalid');
            var fileSize = $('#resume')[0].files[0].size / 1000000;
            if (fileSize >= 3) {
                $('.large-size-msg').css('display', 'block');
                $('form button[type="submit"]').spinner().stop();
                scrollToTop(); // Scroll to top if error occurs
                return false;
            }

            for (var i = 0; i < files.length; i++) {
                formData.append('resume', files[i]);
            }

            formData.append('name', form.find('input[name="name"]').val());
            formData.append('phone', form.find('input[name="phone"]').val());
            formData.append('email', form.find('input[name="email"]').val());
            formData.append('yourself', form.find('textarea[name="yourself"]').val());
            formData.append(form.find('.careersCsrfToken').attr('name'), form.find('.careersCsrfToken').val());
            $('form button[type="submit"]').spinner().start();

            $.ajax({
                url: url,
                type: 'POST',
                contentType: false,
                data: formData,
                processData: false,
                success: function (data) {
                    $('form button[type="submit"]').spinner().stop();
                    var applicantName = form.find('input[name]').val();
                    form.each(function () {
                        this.reset();
                    });
                    formValidation(form, data);
                    var thankyouText = $('#submissionPopup').find('.thankyou-text').val();
                    $('#submissionPopup').find('.modal-body').empty().append('Dear ' + applicantName + thankyouText);
                    $('#submissionPopup').modal();
                },
                error: function () {
                    $('form button[type="submit"]').spinner().stop();
                    $('.job-error').css('display', 'block');
                    scrollToTop(); // Scroll to top if error occurs
                }
            });
            return false;
        });

        // Validate fields on blur
        $('#apply-job-name, #apply-job-number, #apply-job-email, #resume, #yourself').on('blur', function () {
            validateField($(this));
        });
    }
};
