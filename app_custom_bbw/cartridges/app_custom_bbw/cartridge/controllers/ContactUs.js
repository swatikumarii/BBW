'use strict';

/**
 * @namespace ContactUs
 */

var server = require('server');
server.extend(module.superModule);

/**
 * ContactUs-Subscribe : This endpoint is called to submit the shopper's contact information
 */
server.prepend('Subscribe', function (req, res, next) {
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
                msg: Resource.msg('error.message.recaptcha', 'common', null)
            });
            this.emit('route:Complete', req, res);
            return;
        }
    }
    next();
});

module.exports = server.exports();
