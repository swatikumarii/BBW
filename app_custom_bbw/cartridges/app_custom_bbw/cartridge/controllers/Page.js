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

/**
 * Page-SetLocale : This end point is used to change the locale, language and currency of the site, it is not used in the base site, but it is in the base cartridge
 * @function
 * @memberof Page
 */
server.replace('SetLocale', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Currency = require('dw/util/Currency');
    var Site = require('dw/system/Site');
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');

    var currentBasket = BasketMgr.getCurrentBasket();

    var QueryString = server.querystring;
    var currency;
    var currentSite = Site.getCurrent();
    var allowedCurrencies = currentSite.allowedCurrencies;
    var queryStringObj = new QueryString(req.querystring.queryString || '');

    if (Object.hasOwnProperty.call(queryStringObj, 'lang')) {
        delete queryStringObj.lang;
    }

    if (req.setLocale(req.querystring.code)) {
        currency = Currency.getCurrency(req.querystring.CurrencyCode);
        if (allowedCurrencies.indexOf(req.querystring.CurrencyCode) > -1
            && (req.querystring.CurrencyCode !== req.session.currency.currencyCode)) {
            req.session.setCurrency(currency);

            if (currentBasket && currency && currentBasket.currencyCode !== currency.currencyCode) {
                Transaction.wrap(function () {
                    currentBasket.updateCurrency();
                });
            }
        }

        var redirectUrl = URLUtils.url(req.querystring.action).toString();
        if (req.querystring.action === 'Home-Show') {
            // if (currentSite.defaultLocale !== req.querystring.code) {
            //     // redirectUrl = redirectUrl.substring(0, last'/');
            // }
        }
        var qsConnector = redirectUrl.indexOf('?') >= 0 ? '&' : '?';

        redirectUrl = Object.keys(queryStringObj).length === 0
            ? redirectUrl += queryStringObj.toString()
            : redirectUrl += qsConnector + queryStringObj.toString();

        if (req.querystring.action === 'Page-Show' && queryStringObj && queryStringObj.cid) {
            redirectUrl = URLUtils.https(req.querystring.action, 'cid', queryStringObj.cid).toString();
            if (queryStringObj.cid === 'homepage') {
                redirectUrl = URLUtils.https('Home-Show').toString();
                if (req.querystring.action === 'Home-Show') {
                    // if (!defaultLocale) {
                    //     redirectUrl = redirectUrl.substring(0, last'/');
                    // }
                }
            }
        }

        res.json({
            success: true,
            redirectUrl: redirectUrl
        });
    } else {
        res.json({ error: true }); // TODO: error message
    }
    next();
});
module.exports = server.exports();
