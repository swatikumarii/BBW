'use strict';

var profile = require('base/profile/profile');
module.exports = $.extend({}, profile, {
    changeDefaultLocale: function () {
        $('.locale-selector-button').on('click', function () {
            var selectedLocale = $('.locale-selector-dropdown').find(':selected').data('locale');
            var url = $(this).data('action');
            $.ajax({
                url: url,
                type: 'post',
                data: {
                    selectedLocale: selectedLocale
                },
                success(data) {
                    if (data.success) {
                        window.location.href = data.redirectUrl;
                    }
                }
            });
        });
    }
});
