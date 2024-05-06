'use strict';

var index = module.superModule;

index.isFreeItem = require('*/cartridge/models/productLineItem/decorators/isFreeItem');
index.promoPrice = require('*/cartridge/models/productLineItem/decorators/promoPrice');
module.exports = index;
