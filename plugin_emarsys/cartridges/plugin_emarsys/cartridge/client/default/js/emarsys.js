'use strict';

$(document).on(
    'ajaxSuccess',
    function (event, request, settings, data) {
        if (settings.dataTypes.indexOf('json') > -1) {
            if (data && 'emarsysEvents' in data && Array.isArray(data.emarsysEvents)) {
                data.emarsysEvents.forEach(function pushEvent(emarsysEvent) {
                    if (emarsysEvent) {
                        var userEmail = emarsysEvent.email;
                        var ecom = emarsysEvent.ecom;
                        var pagecat = emarsysEvent.pagecat;
                        var cartcontent = emarsysEvent.cartcontent;
                        var emarsys_purchase_command =
                            emarsysEvent.emarsys_purchase_command;
                        ScarabQueue.push(['testMode']);
                        if (userEmail) {
                            ScarabQueue.push(['setEmail', userEmail]);
                        }
                        if (ecom && ecom.detail) {
                            ScarabQueue.push(['view', ecom.detail]);
                        }
                        if (
                            pagecat &&
                            typeof pagecat !== 'undefined' &&
                            pagecat !== ''
                        ) {
                            ScarabQueue.push(['category', pagecat]);
                        }
                        if (typeof cartcontent === 'object') {
                            ScarabQueue.push(['cart', cartcontent]);
                        }

                        if (emarsys_purchase_command) {
                            ScarabQueue.push([
                                'purchase',
                                emarsys_purchase_command
                            ]);
                        }
                        ScarabQueue.push(['go']);
                    }
                });
            }
        }
    }
);
