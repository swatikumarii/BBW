'use strict';

var index = module.superModule;

index.fragranceName = require('*/cartridge/models/product/decorators/fragranceName');
index.fragranceDescription = require('*/cartridge/models/product/decorators/fragranceDescription');
index.titlePartB = require('*/cartridge/models/product/decorators/titlePartB');
index.volume = require('*/cartridge/models/product/decorators/volume');
index.expressShip = require('*/cartridge/models/product/decorators/expressShip');
index.showReturnSection = require('*/cartridge/models/product/decorators/showReturnSection');
index.canBeReturned = require('*/cartridge/models/product/decorators/canBeReturned');
index.usageInstruction = require('*/cartridge/models/product/decorators/usageInstruction');
index.ingredients = require('*/cartridge/models/product/decorators/ingredients');
module.exports = index;
