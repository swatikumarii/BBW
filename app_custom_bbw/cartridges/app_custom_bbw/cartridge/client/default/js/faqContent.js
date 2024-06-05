'use strict';

/** FAQ content collapsible sidebar */
$(document).ready(function () {
    $('.collapsible-sidebar').on('click', function () {
        var $sidebar = $(this);
        var expanded = $sidebar.attr('aria-expanded') === 'true';

        // Toggle aria-expanded attribute
        $sidebar.attr('aria-expanded', !expanded);
    });
});

$(document.body).on('click', function () {
    $('#faq-search-result').addClass('d-none');
});
