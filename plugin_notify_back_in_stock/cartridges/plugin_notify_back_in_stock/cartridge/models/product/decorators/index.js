'use strict';

var index = module.superModule;

index.availableToSell = require('*/cartridge/models/product/decorators/availableToSell');
index.isMaster = require('*/cartridge/models/product/decorators/isMaster');
index.notifyMe = require('*/cartridge/models/product/decorators/notifyMe');
module.exports = index;
