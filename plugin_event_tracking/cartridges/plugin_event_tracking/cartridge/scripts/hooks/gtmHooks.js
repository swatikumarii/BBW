'use strict';

var gtmHelpers = require('*/cartridge/scripts/helpers/gtmHelpers');

/**
 * Should be executed for all the routes.
 * @param {object} route - pdict data from the controller
 */
function registerRoute(route) {
    var onCompleteListeners = route.listeners('route:Complete');
    // deregister existing Complete listeners
    route.off('route:Complete');

    // ensuring our listener executes first
    route.on('route:Complete', function onRouteCompleteHandler(req, res) {
        var isJson = false;
        if (res.renderings.length) {
            for (var i = res.renderings.length - 1; i >= 0; i--) {
                if (
                    res.renderings[i].type === 'render' &&
                    res.renderings[i].subType === 'json'
                ) {
                    isJson = true;
                    break;
                }
            }
        }

        if (isJson) {
            res.viewData.gtmEvents = [];
            var gtmEvent = gtmHelpers.getDataLayer(res.viewData);
            if (gtmEvent) {
                res.viewData.gtmEvents.push(gtmEvent);
            }
        } else {
            res.viewData.datalayer =
                JSON.stringify(gtmHelpers.getDataLayer(res.viewData)) || '';
        }
    });

    // re-register Complete listeners
    onCompleteListeners.forEach(function (listener) {
        route.on('route:Complete', listener);
    });
}

// Ensure gtm is enabled before registering hooks
if (gtmHelpers.isEnabled) {
    module.exports = {
        registerRoute: registerRoute
    };
} else {
    module.exports = {
        registerRoute: function(){}
    };
}
