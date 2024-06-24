'use strict';

var server = require('server');

server.extend(module.superModule);

var seo = require('*/cartridge/scripts/middleware/seo');

server.append('Start', seo.addCurrentPageMetaData);

module.exports = server.exports();
