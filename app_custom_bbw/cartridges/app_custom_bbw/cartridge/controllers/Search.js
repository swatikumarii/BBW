'use strict';

var server = require('server');
server.extend(module.superModule);

var categoryHelper = require('*/cartridge/scripts/helpers/categoryHelper');

server.append('Show', categoryHelper.appendLevelOneCategory);
server.append('ShowAjax', categoryHelper.appendLevelOneCategory);
server.append('UpdateGrid', categoryHelper.appendLevelOneCategory);

module.exports = server.exports();
