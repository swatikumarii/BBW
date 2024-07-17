'use strict';

var server = require('server');

var Resource = require('dw/web/Resource');
var ContentMgr = require('dw/content/ContentMgr');
var seo = require('*/cartridge/scripts/middleware/seo');

/**
 * Faq-UpdateVote : UpdateVote
 * @name Faq-UpdateVote
 */
server.post('UpdateVote', function (req, res, next) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Transaction = require('dw/system/Transaction');
    var userEmail ;
    if (
        req.currentCustomer &&
        req.currentCustomer.profile &&
        req.currentCustomer.profile.email
    ) {
        userEmail = req.currentCustomer.profile.email;
    }
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
            var articleHelpfulUsers = req.form.articleHelpful ? 1 : 0;
            var increment = 1;
            if (
                !faq.custom.articleHelpfulUsers ||
                !faq.custom.articleHelpfulUsers.length
            ) {
                var initialObject = {};
                initialObject[userEmail] = articleHelpfulUsers;
                faq.custom.articleHelpfulUsers = JSON.stringify(initialObject);
            } else {
                var jsonObject = JSON.parse(faq.custom.articleHelpfulUsers);
                if (userEmail in jsonObject) {
                    if (jsonObject[userEmail] && req.form.articleHelpful) {
                        increment = 0;
                    } else if (
                        !jsonObject[userEmail] &&
                        req.form.articleNotHelpful
                    ) {
                        increment = 0;
                    } else if (
                        jsonObject[userEmail] &&
                        req.form.articleNotHelpful
                    ) {
                        faq.custom.articleHelpfulYes =
                            (faq.custom && faq.custom.articleHelpfulYes
                                ? faq.custom.articleHelpfulYes
                                : 0) - 1;
                    } else if (
                        !jsonObject[userEmail] &&
                        req.form.articleHelpful
                    ) {
                        faq.custom.articleHelpfulNo =
                            (faq.custom && faq.custom.articleHelpfulNo
                                ? faq.custom.articleHelpfulNo
                                : 0) - 1;
                    }
                }
                jsonObject[userEmail] = articleHelpfulUsers;
                faq.custom.articleHelpfulUsers = JSON.stringify(jsonObject);
            }
            if (req.form.articleHelpful) {
                faq.custom.articleHelpfulYes =
                    (faq.custom && faq.custom.articleHelpfulYes
                        ? faq.custom.articleHelpfulYes
                        : 0) + increment;
            } else if (req.form.articleNotHelpful) {
                faq.custom.articleHelpfulNo =
                    (faq.custom && faq.custom.articleHelpfulNo
                        ? faq.custom.articleHelpfulNo
                        : 0) + increment;
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
    res.render('/content/faqSearch', folderWiseSearch);
    next();
},seo.addCurrentPageMetaData);

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
