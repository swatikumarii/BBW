'use strict';

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

        if (!isJson) {
            var currentSite = dw.system.Site.getCurrent();
            if (
                currentSite.allowedLocales.length > 2 &&
                request.getLocale() === currentSite.defaultLocale
            ) {
                res.viewData.hrefLang = request
                    .getLocale()
                    .split('_')[1]
                    .toLowerCase();
            } else {
                res.viewData.hrefLang = request
                    .getLocale()
                    .replace('_', '-')
                    .toLowerCase();
            }
        }
    });

    // re-register Complete listeners
    onCompleteListeners.forEach(function (listener) {
        route.on('route:Complete', listener);
    });
}

module.exports = {
    registerRoute: registerRoute
};
