'use strict';

/**
 * @namespace securityBugReport
 */

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * securityBugReport-Landing : This endpoint is used to load the Security Bug Report page
 * @name securityBugReport-Landing
 * @function
 * @param {middleware} server.middleware.https
 * @param {middleware} cache.applyDefaultCache
 * @param {middleware} consentTracking
 * @param {serverfunction} get
 */
server.get('Landing', server.middleware.https, cache.applyDefaultCache, consentTracking.consent, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.render('securityBugReport/securityBugReport', {
        actionUrl: URLUtils.url('securityBugReport-Submit').toString()
    });
    return next();
});

/**
 * securityBugReport-Submit : This endpoint is used submit Security Bug Report form
 * @name securityBugReport-Submit
 * @function
 * @param {middleware} server.middleware.https
 * @param {middleware} cache.applyDefaultCache
 * @param {middleware} consentTracking
 * @param {serverfunction} post
 */
server.post('Submit', server.middleware.https, cache.applyDefaultCache, consentTracking.consent, function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var securityBugReportDetails;
    var form = req.form;
    try{
        Transaction.wrap(function () {
            securityBugReportDetails = CustomObjectMgr.createCustomObject(
                'securityBugReport',
                UUIDUtils.createUUID()
            );
            securityBugReportDetails.custom.firstName = form.securityBugReportFirstName ? form.securityBugReportFirstName : '';
            securityBugReportDetails.custom.lastName = form.securityBugReportLastName ? form.securityBugReportLastName : '';
            securityBugReportDetails.custom.email = form.securityBugReportEmail ? form.securityBugReportEmail : '';
            securityBugReportDetails.custom.phone = form.securityBugReportPhone ? form.securityBugReportPhone : '';
            securityBugReportDetails.custom.company = form.securityBugReportCompanyName ? form.securityBugReportCompanyName : '';
            securityBugReportDetails.custom.vat = form.securityBugReportVat ? form.securityBugReportVat : '';
            securityBugReportDetails.custom.topic = form.securityBugReportTopic ? form.securityBugReportTopic : '';
            securityBugReportDetails.custom.question = form.securityBugReportQuestion ? form.securityBugReportQuestion : '';
        });
    }
    catch(e){
        res.setStatusCode(500);
        res.json({
            success: false,
            errorMessage: Resource.msg(
                'error.message.unable.to.send.data',
                'forms',
                null
            )
        });
        return next();
    }
    res.setViewData({ isSubmitted: true});
    res.json({
        success: true,
        error: false
    });
    return next();
});

module.exports = server.exports();
