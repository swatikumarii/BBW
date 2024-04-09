'use strict';

/**
 * @namespace EmailSubscribe
 */

var server = require('server');
server.extend(module.superModule);

/**
 * EmailSubscribe-Subscribe : The EmailSubscribe-Subscribe enpoint allows the shopper to submit their eamil address to be added to a mailing list. OOB SFRA does not have a mailing list feature however this endpoint call a hook would allow for a customer to easily allow for custiomization
 */
server.prepend('Subscribe', function (req, res, next) {
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var verifyCaptchaHelper = require('*/cartridge/scripts/helpers/verifyCaptchaHelper');

    var isReCaptchaEnable =
        Site.getCurrent().getCustomPreferenceValue(
            'enableGoogleRecaptcha'
        );
    if (isReCaptchaEnable) {
        var recaptchaResponse = req.httpParameterMap
            .get('g-recaptcha-response')
            .getStringValue();
        
        var pageScore = verifyCaptchaHelper.pageScore('newsletter');
        var verifyCaptcha = verifyCaptchaHelper.verifyGoogleCaptcha(
            recaptchaResponse,
            pageScore
        );
        if (!verifyCaptcha) {
            res.json({
                error: true,
                msg: Resource.msg('error.message.recaptcha', 'homePage', null)
            });
            this.emit('route:Complete', req, res);
            return;
        }
    }
    next();
});

module.exports = server.exports();
