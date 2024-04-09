'use strict';

/**
 * @namespace Account
 */

var server = require('server');
server.extend(module.superModule);


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
