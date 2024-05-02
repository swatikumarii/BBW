'use strict';

/**
 * @namespace CorporateGifting
 */

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * CorporateGifting-Landing : This endpoint is used to load the Corporate Gifting page
 * @name CorporateGifting-Landing
 * @function
 * @param {middleware} server.middleware.https
 * @param {middleware} cache.applyDefaultCache
 * @param {middleware} consentTracking
 * @param {serverfunction} get
 */
server.get('Landing', server.middleware.https, cache.applyDefaultCache, consentTracking.consent, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.render('corporateGifting/corporateGifting', {
        actionUrl: URLUtils.url('CorporateGifting-Submit').toString()
    });
    return next();
});

/**
 * CorporateGifting-Submit : This endpoint is used submit Corporate Gifting form
 * @name CorporateGifting-Submit
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
    var corporateGiftingDetails;
    var form = req.form;
    try{
        Transaction.wrap(function () {
            corporateGiftingDetails = CustomObjectMgr.createCustomObject(
                'corporateGifting',
                UUIDUtils.createUUID()
            );
            corporateGiftingDetails.custom.firstName = form.corporateGiftingFirstName ? form.corporateGiftingFirstName : '';
            corporateGiftingDetails.custom.lastName = form.corporateGiftingLastName ? form.corporateGiftingLastName : '';
            corporateGiftingDetails.custom.email = form.corporateGiftingEmail ? form.corporateGiftingEmail : '';
            corporateGiftingDetails.custom.phone = form.corporateGiftingPhone ? form.corporateGiftingPhone : '';
            corporateGiftingDetails.custom.company = form.corporateGiftingCompanyName ? form.corporateGiftingCompanyName : '';
            corporateGiftingDetails.custom.vat = form.corporateGiftingVat ? form.corporateGiftingVat : '';
            corporateGiftingDetails.custom.topic = form.corporateGiftingTopic ? form.corporateGiftingTopic : '';
            corporateGiftingDetails.custom.question = form.corporateGiftingQuestion ? form.corporateGiftingQuestion : '';
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
