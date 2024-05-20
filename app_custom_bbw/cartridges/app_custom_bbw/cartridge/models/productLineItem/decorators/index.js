'use strict';

var index = module.superModule;

index.isFreeItem = require('*/cartridge/models/productLineItem/decorators/isFreeItem');
index.promoPrice = require('*/cartridge/models/productLineItem/decorators/promoPrice');
index.dangerousGoods = require('*/cartridge/models/productLineItem/decorators/dangerousGoods');
index.promotionsHTML = require('*/cartridge/models/productLineItem/decorators/promotionsHTML');

module.exports = index;
