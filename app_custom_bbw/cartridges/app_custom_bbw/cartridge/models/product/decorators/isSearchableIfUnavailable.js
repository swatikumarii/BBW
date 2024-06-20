'use strict';

module.exports = function (object, apiProduct) {

    Object.defineProperty(object, 'isSearchableIfUnavailable', {
        enumerable: true,
        writable: true,
        value:
            !!apiProduct.searchableIfUnavailableFlag
    });
};
