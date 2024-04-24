'use strict';

// this is the id of the form
$('#bug-report-form').submit(function (e) {
    e.preventDefault(); // avoid to execute the actual submit of the form.
    var form = $(this);
    var actionUrl = form.attr('action');
    $.ajax({
        type: 'POST',
        url: actionUrl,
        data: form.serialize(), // serializes the form's elements.
        success: function (data) {
            if(data.isSubmitted){
                $('#bug-report-form').remove();
                $('#sbr-thanks-element').removeClass('d-none');
            }
        }
    });
});
