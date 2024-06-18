'use strict';

/**
 * uploadImage to upload image to s
 * @param {string} imageUrl - image upload url
 * @param {string} imageForm - image form
 * @returns {string} uploaded link
 */
async function uploadImage (imageUrl, imageForm) {
    return new Promise(function(resolve, reject) {
        var imageLink;
        $('#image-progress').show();
        $.ajax({
            method: 'post',
            url: imageUrl,
            timeout: 0,
            processData: false,
            mimeType: 'multipart/form-data',
            contentType: false,
            data: imageForm,
            success: function (response) {
                imageLink = JSON.parse(response).Location;
                resolve(imageLink);
            },
            error: function(error) {
                reject(error); // Reject the promise if there's an error
            }
        });
    });
}

// this is the id of the form
$('#bug-report-form').submit(async function (e) {
    e.preventDefault(); // avoid to execute the actual submit of the form.
    var form = $(this);
    var actionUrl = form.attr('action');
    var sbrImgage = document.getElementById('bug-report-image-upload');
    var imageLink = '';

    if (sbrImgage.files.length > 0 && (sbrImgage.files[0].type || '').indexOf('image/') === -1) {
        $('.bug-report-image-upload').parent().find('.invalid-feedback').text($('#bug-report-image-upload').data('error-type'));
        return false;
    }

    if (sbrImgage.files.length > 0 && sbrImgage.files[0].size > 15728640) {
        $('.bug-report-image-upload').parent().find('.invalid-feedback').text($('#bug-report-image-upload').data('error-size'));
        return false;
    }

    if (sbrImgage.files.length > 0) {
        $.spinner().start();
        var imageForm = new FormData();
        imageForm.append('video', sbrImgage.files[0], sbrImgage.files[0].name);
        var imageUrl = $('input[name=s3Url]').val() + '/upload-video';
        imageLink = await uploadImage(imageUrl, imageForm);
        $.spinner().stop();
    }
    $.ajax({
        type: 'POST',
        url: actionUrl,
        data : form.serialize() + '&location=' + imageLink,
        success: function (data) {
            if(data.isSubmitted){
                $('#bug-report-form').remove();
                $('#sbr-thanks-element').removeClass('d-none');
            }
        }
    });
    return true;
});
