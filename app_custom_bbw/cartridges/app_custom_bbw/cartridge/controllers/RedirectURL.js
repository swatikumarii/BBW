'use strict';

var server = require('server');

server.extend(module.superModule);

var seo = require('*/cartridge/scripts/middleware/seo');

server.prepend('Start', function (req, res, next) {
    // var URLRedirectMgr = require('dw/web/URLRedirectMgr');
    // if (
    //     URLRedirectMgr.getRedirectOrigin() ===
    //     '/.well-known/apple-developer-merchantid-domain-association'
    // ) {
    //     // Intercept the incoming path request
    //     response.setContentType('text/plain');
    //     res.print(require('../scripts/webapp/worker').getWorkerContent()); // Serve up content from worker.js from its actual location
    //     return;
    // }
    if (
        !empty(req.httpHeaders['x-is-path_info']) &&
        (req.httpHeaders['x-is-path_info'] ===
            '/.well-known/apple-developer-merchantid-domain-association' ||
            req.httpHeaders['x-is-path_info'] ===
                '/.well-known/apple-developer-merchantid-domain-association.txt')
    ) {
        if (
            empty(
                dw.system.Site.getCurrent().getCustomPreferenceValue(
                    'applepayDomainVerification'
                )
            )
        ) {
            dw.system.Logger.error(
                'RedirectURL-start: Verification text not set for appleDomainVerification on Site Preferences'
            );
        }

        res.render('applepay/domainverificationcontent', {
            Verification: dw.system.Site.getCurrent().getCustomPreferenceValue(
                'applepayDomainVerification'
            )
        });
        //  res.print(require('../scripts/webapp/worker').getWorkerContent());

        return this.emit('route:Complete', req, res);
    }
    return next();
});

server.append('Start', seo.addCurrentPageMetaData);

module.exports = server.exports();
