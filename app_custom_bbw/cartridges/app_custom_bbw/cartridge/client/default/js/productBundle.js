'use strict';

var processInclude = require('base/util');
processInclude(require('pluginBundling/productBundle'));

$(document).ready(function () {
    // Product Bundle
    if ($('body').find('.bundling').length > 0) {
        var helpers = require('./utils/helpers');
        var elementsToSync = ['.product-name', '.price'];
        var bundleContainers = $('.bundling');

        for (var t = 0; t < bundleContainers.length; t++) {
            var bundleDetails = $(bundleContainers[t]).find('.bundle-product-details');
            helpers.syncProductTileParts(bundleDetails, elementsToSync);
        }
    }
});
