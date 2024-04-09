/**
 * @File Name          : index.js
 * @Description        : index.js file for product badges and available to sell changes
 * Ver       Modification
 * 1.0    Product decorator changes
 */

'use strict';

var index = require('app_storefront_base/cartridge/models/productLineItem/decorators/index');

index.isGiftWrappable = require('*/cartridge/models/productLineItem/decorators/isGiftWrappable');
index.isGiftWrapCategory = require('*/cartridge/models/productLineItem/decorators/isGiftWrapCategory');

module.exports = index;
