/**
 * @File Name          : index.js
 * @Description        : index.js file for product badges and available to sell cahnges
 * @Modification Log   : Rituals-Changes
 * Ver       Modification
 * 1.0    Product decorator changes
 */

'use strict';

var index = require('app_storefront_base/cartridge/models/productLineItem/decorators/index');

index.isGreetingCard = require('*/cartridge/models/productLineItem/decorators/isGreetingCard');

module.exports = index;
