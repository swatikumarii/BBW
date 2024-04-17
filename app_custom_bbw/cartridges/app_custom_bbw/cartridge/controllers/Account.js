'use strict';

/**
 * @namespace Account
 */

var server = require('server');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

/**
 * Append Account-Show controller: Update breadcrumbs
 */
server.append('Show', function (req, res, next) {
    var viewData = res.getViewData();
    var breadcrumbs = [
        {
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        },
        {
            htmlValue: Resource.msg('page.title.myaccount', 'account', null),
            url: URLUtils.url('Account-Show').toString()
        }
    ];
    viewData.breadcrumbs = breadcrumbs;

    res.setViewData(viewData);

    next();
});

/**
 * Account-EditProfile : The Account-EditProfile endpoint is use with append function to append
 * custom profile param to load on profile page
 */

server.append('EditProfile', function (req, res, next) {
    var viewData = res.getViewData();

   
    // function setValueForm(profile) {
    //     var value = {
    //         birthday: profile.birthday,
    //         emailconfirm: profile.email
    //     };
    //     return value;
    // }

    // var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');
    // var accountModel = accountHelpers.getAccountModel(req);

    // var viewData = res.getViewData();
    // var profileModel = setValueForm(accountModel.profile);

    // var pageMetaData = req.pageMetaData;
    // var updatedPageMetaData = commonFunctions.updatePageMetaData(
    //     pageMetaData,
    //     'account.profile.title'
    // );


    var breadcrumbs = [
        {
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        },
        {
            htmlValue: Resource.msg('page.title.myaccount', 'account', null),
            url: URLUtils.url('Account-Show').toString()
        },
        {
            htmlValue: Resource.msg('label.profile.info', 'account', null),
            url: URLUtils.url('Account-EditProfile').toString()
        }
    ];

    viewData.breadcrumbs = breadcrumbs;
    res.setViewData(viewData);

    next();
});


/**
 * Account-Login : The Account-Login endpoint will render the shopper's account page. Once a shopper logs in they will see is a dashboard that displays profile, address, payment and order information.
 */
server.prepend(
    'Login',
    function (req, res, next) {
        var Site = require('dw/system/Site');
        var Resource = require('dw/web/Resource');
        var verifyCaptchaHelper = require('*/cartridge/scripts/helpers/verifyCaptchaHelper');

        var isReCaptchaEnable = Site.getCurrent().getCustomPreferenceValue(
            'enableGoogleRecaptcha'
        );
        if (isReCaptchaEnable) {
            var recaptchaResponse = req.httpParameterMap
                .get('g-recaptcha-response')
                .getStringValue();

            var pageScore = verifyCaptchaHelper.pageScore('login');
            var verifyCaptcha = verifyCaptchaHelper.verifyGoogleCaptcha(
                recaptchaResponse,
                pageScore
            );
            if (!verifyCaptcha) {
                res.json({
                    error: true,
                    msg: Resource.msg('error.message.recaptcha', 'login', null)
                });
                this.emit('route:Complete', req, res);
                return;
            }
        }
        next();
    }
);

/**
 * Account-SubmitRegistration : The Account-SubmitRegistration endpoint is the endpoint that gets hit when a shopper submits their registration for a new account
 */
server.prepend(
    'SubmitRegistration',
    function (req, res, next) {
        var Site = require('dw/system/Site');
        var Resource = require('dw/web/Resource');
        var verifyCaptchaHelper = require('*/cartridge/scripts/helpers/verifyCaptchaHelper');

        var isReCaptchaEnable = Site.getCurrent().getCustomPreferenceValue(
            'enableGoogleRecaptcha'
        );
        if (isReCaptchaEnable) {
            var recaptchaResponse = req.httpParameterMap
                .get('g-recaptcha-response')
                .getStringValue();

            var pageScore = verifyCaptchaHelper.pageScore('registration');
            var verifyCaptcha = verifyCaptchaHelper.verifyGoogleCaptcha(
                recaptchaResponse,
                pageScore
            );
            if (!verifyCaptcha) {
                res.json({
                    error: true,
                    msg: Resource.msg(
                        'error.message.recaptcha',
                        'homePage',
                        null
                    )
                });
                this.emit('route:Complete', req, res);
                return;
            }
        }
        next();
    }
);

module.exports = server.exports();
