'use strict';

var detail = require('base/product/detail');
var base = require('./base');

module.exports = $.extend({}, detail, {
    availability: base.availability,

    addToCart: base.addToCart,

    focusChooseBonusProductModal: base.focusChooseBonusProductModal()
});
