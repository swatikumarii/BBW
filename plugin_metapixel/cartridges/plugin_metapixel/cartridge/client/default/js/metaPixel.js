'use strict';

$(document).on(
    'ajaxSuccess',
    function (event, request, settings, data) {
        if (settings.dataTypes.indexOf('json') > -1) {
            if (data && 'fbqEvents' in data && Array.isArray(data.fbqEvents)) {
                data.fbqEvents.forEach(function metaEvent(fbqEvent) {
                    if (fbqEvent) {
                        fbq('track', fbqEvent.event,fbqEvent.data);
                    }
                });
            }
        }
    }
);
