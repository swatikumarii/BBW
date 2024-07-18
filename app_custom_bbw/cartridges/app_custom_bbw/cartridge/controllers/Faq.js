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
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var contentId = req.form.currentContentId;
    var faq = CustomObjectMgr.getCustomObject('faqVotes', contentId);
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    var usersArticleHelpful = customer.profile.custom.usersArticleHelpful || "";
    
    Transaction.wrap(function () {
        if (!faq) {
            // create custom object
            faq = CustomObjectMgr.createCustomObject('faqVotes', contentId);
        }
        if (faq) {
            var articleHelpfulUsers = req.form.articleHelpful ? 1 : 0;
            var increment = 1;
            if (!usersArticleHelpful.length) {
                var initialObject = {};
                initialObject[contentId] = articleHelpfulUsers;
                customer.profile.custom.usersArticleHelpful =
                    JSON.stringify(initialObject);
            } else {
                var jsonObject = JSON.parse(usersArticleHelpful);
                if (contentId in jsonObject) {
                    if (jsonObject[contentId] && req.form.articleHelpful) {
                        increment = 0;
                    } else if (
                        !jsonObject[contentId] &&
                        req.form.articleNotHelpful
                    ) {
                        increment = 0;
                    } else if (
                        jsonObject[contentId] &&
                        req.form.articleNotHelpful
                    ) {
                        faq.custom.articleHelpfulYes =
                            (faq.custom && faq.custom.articleHelpfulYes
                                ? faq.custom.articleHelpfulYes
                                : 0) - 1;
                    } else if (
                        !jsonObject[contentId] &&
                        req.form.articleHelpful
                    ) {
                        faq.custom.articleHelpfulNo =
                            (faq.custom && faq.custom.articleHelpfulNo
                                ? faq.custom.articleHelpfulNo
                                : 0) - 1;
                    }
                }
                jsonObject[contentId] = articleHelpfulUsers;
                customer.profile.custom.usersArticleHelpful =
                    JSON.stringify(jsonObject);
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
