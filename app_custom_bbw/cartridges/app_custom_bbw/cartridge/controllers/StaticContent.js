'use strict';

var server = require('server');
var ContentMgr = require('dw/content/ContentMgr');

/**
 * StaticContent-Dashboard : Show folder heirarchy on UI
 * @name StaticContent-Dashboard
 */
server.get('Dashboard', function (req, res, next) {
    var currentFolder = ContentMgr.getFolder(req.querystring.cid);
    if (currentFolder) {
        res.render('content/faqDashboard', {
            folders: currentFolder.onlineSubFolders
        });
    }
    next();
});

/**
 * StaticContent-ContentBody
 */
server.get('ContentBody', function (req, res, next) {
    var contentAsset = ContentMgr.getContent(req.querystring.cid);
    var contentAssetBody;
    if (
        contentAsset &&
        'custom' in contentAsset &&
        'body' in contentAsset.custom
    ) {
        contentAssetBody = contentAsset.custom.body.markup;
    }
    res.json({ contentAssetBody: contentAssetBody });
    next();
});

/**
 * StaticContent-DashboardFAQ : Show FAQs and search field
 * @name StaticContent-DashboardFAQ
 */
server.get('DashboardFAQ', function (req, res, next) {
    var folder = ContentMgr.getFolder(req.querystring.fid);
    if (folder) {
        res.render('content/faqDashboardFAQ', {
            folder: folder,
            isWrapped: req.querystring.isWrapped === 'true'
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
        var parentFolder = ContentMgr.getFolder(req.querystring.pid);
        res.render('content/faqLevel2', {
            folder: currentFolder,
            parentFolder: parentFolder
        });
    }
    next();
});

/**
 * StaticContent-ContentNames : Show Content Names
 * @name StaticContent-ContentNames
 */
server.get('ContentNames', function (req, res, next) {
    var currentFolder = ContentMgr.getFolder(req.querystring.fid);
    if (currentFolder) {
        res.render('content/faqContent', {
            contents: currentFolder.onlineContent,
            currentContentId: req.querystring.cid,
            currentFolder: currentFolder
        });
    }
    next();
});

/**
 * StaticContent-FaqFooter : Show Content Names
 * @name StaticContent-FaqFooter
 */
server.get('FaqFooter', function (req, res, next) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var apiContent = ContentMgr.getContent(req.querystring.cid);
    if (apiContent) {
        var faq = CustomObjectMgr.getCustomObject(
            'faqVotes',
            req.querystring.cid
        );
        var articleHelpful;
        var articleTotalResponse;
        if (faq) {
            articleHelpful = faq.custom.articleHelpfulYes
                ? faq.custom.articleHelpfulYes
                : 0;
            articleTotalResponse = articleHelpful + (faq.custom.articleHelpfulNo
                ? faq.custom.articleHelpfulNo
                : 0);
        } else {
            articleHelpful = 0;
            articleTotalResponse = 0;
        }
        var relatedArticles = [];
        apiContent.custom.relatedArticles.forEach(
            function (relatedArticle, index) {
                relatedArticles[index] = ContentMgr.getContent(relatedArticle);
            }
        );
        res.render('content/faqFooter', {
            currentContentId: req.querystring.cid,
            articleHelpful: articleHelpful,
            articleTotalResponse: articleTotalResponse,
            relatedArticles: relatedArticles
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
