'use strict';

/** FAQ content collapsible sidebar */
$(document).ready(function () {
    $('#query').on('keyup', function () {
        var searchPhrases = $(this).val();
        if (searchPhrases.length >= 3) {
            $.spinner().start();
            $.ajax({
                url: $('.faq-search-url').data('url') + encodeURIComponent(searchPhrases),
                method: 'GET',
                success: function (response) {
                    if (typeof (response) !== 'object') {
                        $('.faq-search-suggestions').find('.faq-suggestions').empty().append(response);
                    } else {
                        $('.search-suggestions').find('.suggestions').empty().hide();
                    }
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        }
    });
});
