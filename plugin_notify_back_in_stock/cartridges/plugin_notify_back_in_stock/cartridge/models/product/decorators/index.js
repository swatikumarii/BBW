'use strict';

var index = require('app_storefront_base/cartridge/models/product/decorators/index');

index.availableToSell = require('*/cartridge/models/product/decorators/availableToSell');
index.isMaster = require('*/cartridge/models/product/decorators/isMaster');
index.notifyMe = require('*/cartridge/models/product/decorators/notifyMe');
module.exports = index;
