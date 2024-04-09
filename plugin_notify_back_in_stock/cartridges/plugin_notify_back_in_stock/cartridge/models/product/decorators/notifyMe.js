'use strict';


module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'enableNotifyMe', {
        enumerable: true,
        value: apiProduct && 'enableNotifyMe' in apiProduct.custom ? apiProduct.custom.enableNotifyMe : false
    });
    Object.defineProperty(object, 'notifyMeThreshold', {
        enumerable: true,
        value: apiProduct && 'notifyMeThreshold' in apiProduct.custom ? apiProduct.custom.notifyMeThreshold : null
    });
};