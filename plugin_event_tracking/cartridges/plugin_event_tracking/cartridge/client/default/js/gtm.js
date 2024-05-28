'use strict';

$(document).on(
    'ajaxSuccess',
    function (event, request, settings, data) {
        if (settings.dataTypes.indexOf('json') > -1) {
            if (
                data &&
                        'gtmEvents' in data &&
                        Array.isArray(data.gtmEvents)
            ) {
                data.gtmEvents.forEach(function gtmEvent(gtmEvent) {
                    if (gtmEvent) {
                        dataLayer.push(gtmEvent);
                    }
                });
            }
        }
    }
);
