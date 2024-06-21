'use strict';

/**
 * @namespace securityBugReport
 */

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var seo = require('*/cartridge/scripts/middleware/seo');

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
        actionUrl: URLUtils.url('SecurityBugReport-Submit').toString()
    });
    return next();
},seo.addCurrentPageMetaData);

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
            securityBugReportDetails.custom.name = form.bugReportName ? form.bugReportName : '';
            securityBugReportDetails.custom.email = form.bugReportEmail ? form.bugReportEmail : '';
            securityBugReportDetails.custom.phone = form.bugReportPhone ? form.bugReportPhone : '';
            securityBugReportDetails.custom.pageUrl = form.bugReportPageUrl ? form.bugReportPageUrl : '';
            securityBugReportDetails.custom.image = form.location ? form.location : '';
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
