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

server.get('ConfirmationEmailContent', function (req, res, next) {
    var emailContentHelpers = require('*/cartridge/scripts/helpers/emailContentHelpers');
    var encryptionHelper = require('*/cartridge/scripts/helpers/encryptionHelpers');
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var emailMarkup = '';
    var emailContent = ContentMgr.getContent('email-order-confirmation'); // Order Confirmation Email Content Asset Id
    var currentLocale = Locale.getLocale(req.locale.id);

    if (!empty(emailContent) && emailContent.online) {
        emailMarkup = emailContent.custom.body.markup;
    }
    var orderNo = encryptionHelper.decryptPin(
        decodeURIComponent(req.querystring.token)
    );
    var order = OrderMgr.getOrder(orderNo);
    var orderModel = new OrderModel(order, {
        countryCode: currentLocale.country,
        containerView: 'order'
    });

    var data = {
        order: orderModel,
        markup: emailMarkup,
        content: emailContentHelpers.getEmailContent(
            'normal-footer',
            'email-header'
        )
    };
    res.render('checkout/confirmation/confirmationEmail', data);
    next();
});

server.get('CancelledEmailContent', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var emailContentHelpers = require('*/cartridge/scripts/helpers/emailContentHelpers');
    var encryptionHelper = require('*/cartridge/scripts/helpers/encryptionHelpers');
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var currentLocale = Locale.getLocale(req.locale.id);

    var orderNo = encryptionHelper.decryptPin(
        decodeURIComponent(req.querystring.token)
    );
    var order = OrderMgr.getOrder(orderNo);
    var orderModel = new OrderModel(order, {
        countryCode: currentLocale.country,
        containerView: 'order'
    });
    var encodedOrderNumber = encodeURIComponent(
        encryptionHelper.encryptPin(orderModel.orderNumber)
    );

    var cancelEmailMarkup = '';
    var cancelEmailFooterMarkup = '';
    var emailContent = ContentMgr.getContent('email-good-to-konw-block'); // Canceled Order Email Content Asset Id
    var emailFooterContent = ContentMgr.getContent('email-order-confirmation'); // Canceled Order Email Footer Image Content Asset Id

    if (!empty(emailContent) && emailContent.online) {
        cancelEmailMarkup = emailContent.custom.body.markup;
    }

    if (!empty(emailFooterContent) && emailFooterContent.online) {
        cancelEmailFooterMarkup = emailFooterContent.custom.body.markup;
    }
    var data = {
        order: orderModel,
        invoiceUrl: URLUtils.https(
            'Order-InvoiceDownload',
            'token',
            encodedOrderNumber
        ).toString(),
        content: emailContentHelpers.getEmailContent(
            'normal-footer',
            'email-header'
        ),
        markup: cancelEmailMarkup,
        footermarkup: cancelEmailFooterMarkup
    };
    res.render('mail/orderStatus/orderCancelledEmail', data);
    next();
});

server.get('ShippedEmailContent', function (req, res, next) {
    var emailContentHelpers = require('*/cartridge/scripts/helpers/emailContentHelpers');
    var encryptionHelper = require('*/cartridge/scripts/helpers/encryptionHelpers');
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var currentLocale = Locale.getLocale(req.locale.id);

    var orderNo = encryptionHelper.decryptPin(
        decodeURIComponent(req.querystring.token)
    );
    var order = OrderMgr.getOrder(orderNo);
    var orderModel = new OrderModel(order, {
        countryCode: currentLocale.country,
        containerView: 'order'
    });

    var shippedEmailMarkup = '';
    var shippedEmailFooterMarkup = '';
    var shippedemailContent = ContentMgr.getContent(
        'email-good-to-konw-shipped-block'
    );

    if (!empty(shippedemailContent) && shippedemailContent.online) {
        shippedEmailMarkup = shippedemailContent.custom.body.markup;
    }

    var data = {
        order: orderModel,
        content: emailContentHelpers.getEmailContent('normal-footer', 'email-header'),
        markup: shippedEmailMarkup,
        footermarkup: shippedEmailFooterMarkup
    };
    res.render('mail/orderStatus/orderShippingEmail', data);
    next();
});


module.exports = server.exports();
