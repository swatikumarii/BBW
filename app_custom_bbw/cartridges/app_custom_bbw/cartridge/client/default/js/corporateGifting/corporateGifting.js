'use strict';

// this is the id of the form
$('#corporate-gifting-form').submit(function (e) {
    e.preventDefault(); // avoid to execute the actual submit of the form.
    var form = $(this);
    var actionUrl = form.attr('action');
    $.ajax({
        type: 'POST',
        url: actionUrl,
        data: form.serialize(), // serializes the form's elements.
        success: function (data) {
            if(data.isSubmitted){
                $('#corporate-gifting-form').remove();
                $('#corporate-thanks-element').removeClass('d-none');
            }
        }
    });
});
