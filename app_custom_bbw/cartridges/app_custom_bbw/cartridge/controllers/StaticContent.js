'use strict';

var server = require('server');

server.get('Folders', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var folders = [];
    var contents = [];
    var currentFolder = ContentMgr.getFolder(req.querystring.cid);
    var fromLevel = req.querystring.fromLevel || 0;
    var level = req.querystring.level || 3;
    if (currentFolder && /^\d+$/.test(fromLevel) && /^\d+$/.test(level)) {
        fromLevel = Number(fromLevel);
        if (fromLevel <= 0) {
            folders.push(currentFolder);
        } else if (currentFolder.onlineSubFolders.length > 0) {
            folders = currentFolder.onlineSubFolders;
        } else {
            contents = currentFolder.onlineContent;
        }
        res.render('content/contentAssetFolders', {
            folders: folders,
            contents: contents,
            level: level
        });
    }
    next();
});

module.exports = server.exports();
