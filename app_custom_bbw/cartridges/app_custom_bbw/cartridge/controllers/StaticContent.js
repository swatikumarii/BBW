'use strict';

var server = require('server');
var ContentMgr = require('dw/content/ContentMgr');

/**
 * StaticContent-Folders : Show folder heirarchy on UI
 * @name StaticContent-Folders
 */
server.get('Dashboard', function (req, res, next) {
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
        res.render('content/faqDashboard', {
            folders: folders,
            contents: contents,
            level: level
        });
    }
    next();
});

/**
 * StaticContent-FaqLevel1 : Show folder heirarchy on UI
 * @name StaticContent-FaqLevel1
 */
server.get('FaqLevel1', function (req, res, next) {
    var currentFolder = ContentMgr.getFolder(req.querystring.cid);
    if (currentFolder) {
        res.render('content/faqLevel1', {
            folder: currentFolder
        });
    }
    next();
});

/**
 * StaticContent-FaqLevel2 : Show folder heirarchy on UI
 * @name StaticContent-FaqLevel2
 */
server.get('FaqLevel2', function (req, res, next) {
    var currentFolder = ContentMgr.getFolder(req.querystring.cid);
    if (currentFolder) {
        var parentFolder = ContentMgr.getFolder(req.querystring.pcid);
        res.render('content/faqLevel2', {
            folder: currentFolder,
            parentFolder: parentFolder
        });
    }
    next();
});

server.get('Folders', function (req, res, next) {
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
