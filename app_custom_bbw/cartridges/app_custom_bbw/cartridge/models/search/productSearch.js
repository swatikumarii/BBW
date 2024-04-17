'use strict';

var base = module.superModule || {};

// Need to import static file to add prototype from storefront base because of bug in plugin cartridge.
// Will remove this once bug is fixed in cartridge
var storefrontBase = require('app_storefront_base/cartridge/models/search/productSearch');

/**
 * @class
 * @classdesc ProductSearch class
 */
function ProductSearch() {
    base.apply(this, arguments);
}

ProductSearch.prototype = Object.create(storefrontBase.prototype);

module.exports = ProductSearch;
