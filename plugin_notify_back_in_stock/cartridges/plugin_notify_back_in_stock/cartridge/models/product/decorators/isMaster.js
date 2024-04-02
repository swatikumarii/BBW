'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'isMaster', {
        enumerable: true,
        value: apiProduct.master
    });
};
