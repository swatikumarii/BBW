'use strict';

var emarsysHelpers = require('*/cartridge/scripts/helpers/emarsysHelpers');

/**
 * Should be executed for all the routes.
 * @param {object} route - pdict data from the controller
 */
function registerRoute(route) {
    var Site = require('dw/system/Site');
    var emarsysTestModeEnabled = Site.getCurrent().getCustomPreferenceValue(
        'emarsysTestModeEnabled'
    );
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
        res.viewData.email =
            'currentCustomer' in req &&
            'profile' in req.currentCustomer &&
            req.currentCustomer.profile.email;
        if (isJson) {
            res.viewData.emarsysEvents = [];
            var emarsysData = emarsysHelpers.getScarabQueueData(res.viewData);
            if (emarsysData) {
                res.viewData.emarsysTestModeEnabled = emarsysTestModeEnabled;
                res.viewData.emarsysEvents.push(emarsysData);
            }
        } else {
            res.viewData.emarsysTestModeEnabled = emarsysTestModeEnabled;
            res.viewData.emarsysData = emarsysHelpers.getScarabQueueData(
                res.viewData
            );
        }
    });

    // re-register Complete listeners
    onCompleteListeners.forEach(function (listener) {
        route.on('route:Complete', listener);
    });
}

// Ensure emarsys is enabled before registering hooks
if (emarsysHelpers.isEnabled) {
    module.exports = {
        registerRoute: registerRoute
    };
} else {
    module.exports = {
        registerRoute: function () {}
    };
}
