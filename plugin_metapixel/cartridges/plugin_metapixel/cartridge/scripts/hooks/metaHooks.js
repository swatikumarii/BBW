'use strict';

var ISML = require('dw/template/ISML');
var metaPixelHelpers = require('*/cartridge/scripts/helpers/metaPixelHelpers');


/** 
 * Should be executed inside of the head tags
 * Renders MetaPixel code.
 * @param {object} pdict - pdict data from the controller
 */
function htmlHead(pdict) {
    var fbqData = metaPixelHelpers.getFbqData(pdict);

    ISML.renderTemplate('components/metaPixel/metaPixelScript', {
        action: pdict.action,
        fbqData: fbqData
    });
}


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
            res.viewData.fbqEvents = [];
            var fbqData = metaPixelHelpers.getFbqData(res.viewData);
            if (fbqData) {
                res.viewData.fbqEvents.push(fbqData);
            }
        }
    });

    // re-register Complete listeners
    onCompleteListeners.forEach(function (listener) {
        route.on('route:Complete', listener);
    });
}

// Ensure metaPixel is enabled before registering hooks
if (metaPixelHelpers.isEnabled) {
    module.exports = {
        htmlHead: htmlHead,
        registerRoute: registerRoute
    };
} else {
    module.exports = {
        htmlHead: function(){},
        registerRoute: function(){}
    };
}
