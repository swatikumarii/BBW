'use strict';

/**
 * @namespace Login
 */

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * This Route is to render Registration form page
 */
server.get(
    'CreateAccount',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var Resource = require('dw/web/Resource');
        var target = req.querystring.rurl || 1;

        var createAccountUrl = URLUtils.url(
            'Account-SubmitRegistration',
            'rurl',
            target
        )
            .relative()
            .toString();
        var navTabValue = req.querystring.action;


        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            }
        ];
        var Site = require('dw/system/Site');
        var nationality =  Site.getCurrent().getCustomPreferenceValue('nationality');
        var nationalityCO = Site.getCurrent().getCustomPreferenceValue('nationalities');
        var nationalities = nationalityCO.length > 0 ? nationalityCO.split(',') : [];
        var profileForm = server.forms.getForm('profile');
        profileForm.clear();
        profileForm.customer.nationality.value = nationality;

        res.render('/account/register', {
            navTabValue: navTabValue || 'signup',
            profileForm: profileForm,
            breadcrumbs: breadcrumbs,
            oAuthReentryEndpoint: 1,
            createAccountUrl: createAccountUrl,
            nationalities: nationalities,
            nationality: nationality
        });

        next();
    }
);

module.exports = server.exports();
