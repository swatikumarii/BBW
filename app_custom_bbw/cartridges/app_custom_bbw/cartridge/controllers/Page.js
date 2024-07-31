'use strict';

/**
 * @namespace Page
 */

var server = require('server');
server.extend(module.superModule);

/**
 * Page-IncludeHeaderMenu : Append for customer name
 */
server.append(
    'IncludeHeaderMenu',
    server.middleware.include,
    function (req, res, next) {
        var viewData = res.getViewData();
        viewData.customerName = req.currentCustomer.profile
            ? req.currentCustomer.profile.firstName
            : null;
        res.setViewData(viewData);
        next();
    }
);

/**
 * Page-Show : This end point will render a content asset in full storefront page
 * @function
 * @memberof Page
 */
server.append('Show', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var PageMgr = require('dw/experience/PageMgr');
    var ContentModel = require('*/cartridge/models/content');
    var commonHelper = require('*/cartridge/scripts/helpers/commonHelpers');
    var seoHelper = require('*/cartridge/scripts/helpers/seoHelper');

    var viewData = res.getViewData();

    var page = PageMgr.getPage(req.querystring.cid);

    if (!(page !== null && page.isVisible())) {
        var apiContent = ContentMgr.getContent(req.querystring.cid);
        var canonicalUrl = seoHelper.getCanonicalUrl(
            'Page-Show',
            'cid',
            req.querystring.cid
        );
        if (apiContent) {
            viewData.canonicalUrl = canonicalUrl;
            var content = new ContentModel(apiContent, 'content/contentAsset');
            var breadcrumbs =
                commonHelper.getBreadcrumbForContentAsset(apiContent);
            if (
                !empty(apiContent) &&
                'image' in apiContent.custom &&
                'absURL' in apiContent.custom.image
            ) {
                viewData.image = apiContent.custom.image.absURL;
            }
            if (content.template && breadcrumbs) {
                viewData.breadcrumbs = breadcrumbs;
                res.setViewData(viewData);
            }
        }
    }
    next();
});

/**
 * Page-Locale : The Page-Locale endpoint is used as a remote include that renders the country selector ISML template
 * @function
 * @memberof Page
 */
server.get('ProfileLocale', function (req, res, next) {
    var LocaleModel = require('*/cartridge/models/locale');
    var Locale = require('dw/util/Locale');
    var Site = require('dw/system/Site');

    var currentSite = Site.getCurrent();
    var siteId = currentSite.getID();
    var allowedLocales = currentSite.allowedLocales;
    var currentLocale = Locale.getLocale(req.locale.id);
    var localeModel = new LocaleModel(currentLocale, allowedLocales, siteId);
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var loggedInCustomer =
        'currentCustomer' in req &&
        'raw' in req.currentCustomer &&
        req.currentCustomer.raw.authenticated;
    var customerNo;
    localeModel.preferredLocale = false;
    if (loggedInCustomer) {
        customerNo = req.currentCustomer.profile.customerNo;
        if (customerNo) {
            var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
            localeModel.preferredLocale =
                'profile' in customer &&
                'custom' in customer.profile &&
                'preferredLocale' in customer.profile.custom
                    ? customer.profile.custom.preferredLocale
                    : false;
        }
    }
    var template = req.querystring.mobile
        ? '/account/components/mobileLocaleSelectorProfile'
        : '/account/components/localeSelectorProfile';

    res.render(template, { localeModel: localeModel });
    next();
});

/**
 * Page-SetDefaultLocale : The Page-SetDefaultLocale endpoint is used as a remote include that renders the country selector ISML template
 * @function
 * @memberof Page
 */
server.post('SetDefaultLocale', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var selectedLocale = req.form.selectedLocale;
    var loggedInCustomer =
        'currentCustomer' in req &&
        'raw' in req.currentCustomer &&
        req.currentCustomer.raw.authenticated;
    var customerNo;
    if (loggedInCustomer) {
        customerNo = req.currentCustomer.profile.customerNo;
        if (selectedLocale && req.setLocale(selectedLocale)) {
            var redirectUrl = URLUtils.url('Account-EditProfile').toString();
            var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
            if (customer) {
                Transaction.wrap(function () {
                    customer.profile.custom.preferredLocale = selectedLocale;
                });
            }
            res.json({
                success: true,
                redirectUrl: redirectUrl
            });
        }
    }
    next();
});
module.exports = server.exports();
