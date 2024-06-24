'use strict';

var helpers = require('../utils/helpers');
var elementsToSync = ['.pdp-link', '.b-product-tile__img-wrapper', '.tile-body', '.price', '.js-product-tile', '.js-product-tile-promo', '.js-promo-wrapper', '.js-product-tile-price','.js-product-tile-badge'];
var shopModuleContainers = $('.js-shop-the-module-scroll');

for (var t = 0; t < shopModuleContainers.length; t++) {
    var shopModuleSlides = $(shopModuleContainers[t]).find('.js-shop-the-module-slide');
    helpers.syncProductTileParts(shopModuleSlides, elementsToSync);
}
