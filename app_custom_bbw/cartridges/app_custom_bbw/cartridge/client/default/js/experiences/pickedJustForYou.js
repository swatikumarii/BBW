'use strict';

var helpers = require('../utils/helpers');
var elementsToSync = ['.pdp-link', '.b-product-tile__img-wrapper', '.tile-body', '.price', '.js-product-tile', '.js-product-tile-promo', '.js-promo-wrapper', '.js-product-tile-price'];
var pickedJustyouContainers = $('.js-picked-just-recomm');

for (var t = 0; t < pickedJustyouContainers.length; t++) {
    var pickedJustyouSlide = $(pickedJustyouContainers[t]).find('.js-picked-just-recomm-item');
    helpers.syncProductTileParts(pickedJustyouSlide, elementsToSync);
}
