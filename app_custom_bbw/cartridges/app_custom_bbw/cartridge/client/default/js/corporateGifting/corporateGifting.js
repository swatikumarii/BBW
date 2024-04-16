'use strict';

/**
 * Creates a div which contains html ements passed to this function in string
 * @param {string} htmlString - html string
 * @returns {object} html elements
 */
function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    // Change this to div.childNodes to support multiple top-level nodes.
    return div.firstChild;
}

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
            var html = data.htmlcontent;
            if(data.isSubmitted){
                var f = document.getElementById('corporate-gifting-form');
                f.parentNode.removeChild(f);
            }
            var div = document.getElementById('corporate-gifting-form-card');
            var z = document.createElement('p');
            z = createElementFromHTML(html);
            div.appendChild(z);
        }
    });
});
