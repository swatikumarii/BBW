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
 * @param {querystringparameter} radius - The radius that the shopper selected to refine the search
 * @param {querystringparameter} postalCode - The postal code that the shopper used to search
 * @param {querystringparameter} lat - The latitude of the shopper position
 * @param {querystringparameter} long - The longitude of the shopper position
 * @param {querystringparameter} showMap - A flag indicating whether or not map is to be shown
 * @param {querystringparameter} horizontalView - Boolean value to show map in Horizontal View
 * @param {querystringparameter} isForm - Boolean value to show (or not) the form to Find Stores
 * @param {serverfunction} get
 */
server.get('Landing', server.middleware.https, cache.applyDefaultCache, consentTracking.consent, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.render('corporateGifting/corporateGifting', {
        actionUrl: URLUtils.url('CorporateGifting-Submit').toString()
    });
    next();
});

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
                'corporate-gifting',
                UUIDUtils.createUUID()
            );
            corporateGiftingDetails.custom.firstName = form.corporateGiftingFirstName ? form.corporateGiftingFirstName : '';
            corporateGiftingDetails.custom.lastName = form.corporateGiftingLastName ? form.corporateGiftingLastName : '';
            corporateGiftingDetails.custom.email = form.corporateGiftingEmail ? form.corporateGiftingEmail : '';
            corporateGiftingDetails.custom.topic = form.corporateGiftingTopic ? form.corporateGiftingTopic : '';
            corporateGiftingDetails.custom.comment = form.corporateGiftingComment ? form.corporateGiftingComment : '';
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
        next();
    }
    next();
});

module.exports = server.exports();
