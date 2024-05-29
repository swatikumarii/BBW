'use strict';

var server = require('server');

var Resource = require('dw/web/Resource');
var ContentMgr = require('dw/content/ContentMgr');

/**
 * Faq-UpdateVote : UpdateVote
 * @name Faq-UpdateVote
 */
server.post('UpdateVote', function (req, res, next) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Transaction = require('dw/system/Transaction');
    var faq = CustomObjectMgr.getCustomObject(
        'faqVotes',
        req.form.currentContentId
    );
    Transaction.wrap(function () {
        if (!faq) {
            // create custom object
            faq = CustomObjectMgr.createCustomObject(
                'faqVotes',
                req.form.currentContentId
            );
        }
        if (faq) {
            if (req.form.articleHelpful) {
                faq.custom.articleHelpfulYes =
                    (faq.custom && faq.custom.articleHelpfulYes
                        ? faq.custom.articleHelpfulYes
                        : 0) + 1;
            } else if (req.form.articleNotHelpful) {
                faq.custom.articleHelpfulNo =
                    (faq.custom && faq.custom.articleHelpfulNo
                        ? faq.custom.articleHelpfulNo
                        : 0) + 1;
            }
        }
    });
    res.json({
        articleVoteStatusMessage: Resource.msgf(
            'faq.found.helpful',
            'faq',
            null,
            faq.custom.articleHelpfulYes,
            faq.custom.articleHelpfulNo + faq.custom.articleHelpfulYes
        )
    });
    next();
});

/**
 * Faq-UpdateVote : UpdateVote
 * @name Faq-UpdateVote
 */
server.post('GetContentAssets', function (req, res, next) {
    var contentIds = req.form.contentIds;
    var contentAssets = [];
    if (contentIds) {
        contentIds = contentIds.split(',');
        for (var i = 0; i < contentIds.length; i++) {
            if (contentIds[i] !== req.form.currentContentId) {
                var content = ContentMgr.getContent(contentIds[i]);
                if (content) {
                    contentAssets.push(content);
                }
            }
        }
    }
    res.render('/content/faqRecentArticlesLi', {
        contentAssets: contentAssets
    });
    next();
});

/**
 * Faq-Search : Search
 * @name Faq-Search
 */
server.get('Search', function (req, res, next) {
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var folderWiseSearch = searchHelper.setupFaqContentSearch(req.querystring);
    res.render('/content/faqSearch', {
        searchResult: folderWiseSearch
    });
    next();
});

/**
 * Faq-Content : Content search
 */
server.get('Content', function (req, res, next) {
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');

    var contentSearch = searchHelper.getContentSearch(req.querystring);
    res.render('/content/faqContentSearch', {
        contentSearch: contentSearch
    });
    next();
});

module.exports = server.exports();
