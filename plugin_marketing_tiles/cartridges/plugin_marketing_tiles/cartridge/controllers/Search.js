'use strict';

var server = require('server');
server.extend(module.superModule);

var marketingTilesHelper = require('*/cartridge/scripts/helpers/marketingTilesHelper');

server.append('Show', marketingTilesHelper.appendMarketingTiles);
server.append('ShowAjax', marketingTilesHelper.appendMarketingTiles);
server.append('UpdateGrid', marketingTilesHelper.appendMarketingTiles);

module.exports = server.exports();
