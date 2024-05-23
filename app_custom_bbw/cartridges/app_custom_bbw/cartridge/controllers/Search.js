'use strict';

var server = require('server');
server.extend(module.superModule);

var categoryHelper = require('*/cartridge/scripts/helpers/categoryHelper');

server.append(
    'Show',
    categoryHelper.appendLevelOneCategory,
    categoryHelper.appendSearchBreadcrum
);
server.append(
    'ShowAjax',
    categoryHelper.appendLevelOneCategory,
    categoryHelper.appendCategoryBreadcrum
);
server.append(
    'UpdateGrid',
    categoryHelper.appendLevelOneCategory,
    categoryHelper.appendCategoryBreadcrum
);

module.exports = server.exports();
