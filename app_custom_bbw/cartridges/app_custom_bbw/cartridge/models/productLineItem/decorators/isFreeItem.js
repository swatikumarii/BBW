'use strict';

module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'isFreeItem', {
        enumerable: true,
        value: lineItem.custom.isFreeItem
    });
};
