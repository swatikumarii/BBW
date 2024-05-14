'use strict';

var server = require('server');

var Resource = require('dw/web/Resource');
var ContentMgr = require('dw/content/ContentMgr');
var Transaction = require('dw/system/Transaction');

/**
 * Faq-UpdateVote : UpdateVote
 * @name Faq-UpdateVote
 */
server.post('UpdateVote', function (req) {
    var apiContent = ContentMgr.getContent(req.form.currentContentId);
    if (apiContent) {
        Transaction.wrap(function () {
            if (req.form.articleHelpful) {
                apiContent.custom.articleHelpfulYes =
                    apiContent.custom && apiContent.custom.articleHelpfulYes
                        ? apiContent.custom.articleHelpfulYes
                        : 0 + 1;
            } else if (req.form.articleNotHelpful) {
                apiContent.custom.articleHelpfulNo =
                    apiContent.custom && apiContent.custom.articleHelpfulNo
                        ? apiContent.custom.articleHelpfulNo
                        : 0 + 1;
            }
        });
    }
    return {
        articleVoteStatusMessage: Resource.msgf(
            'faq.found.helpful',
            'faq',
            null,
            apiContent.custom.articleHelpfulYes,
            apiContent.custom.articleHelpfulNo +
                apiContent.custom.articleHelpfulYes
        )
    };
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

module.exports = server.exports();
