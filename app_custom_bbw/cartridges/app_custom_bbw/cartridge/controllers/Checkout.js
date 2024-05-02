'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Begin', function (req, res, next) {
    var viewData = res.getViewData();
    if (viewData.currentStage === 'customer') {
        viewData.currentStage = 'shipping';
    }
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
