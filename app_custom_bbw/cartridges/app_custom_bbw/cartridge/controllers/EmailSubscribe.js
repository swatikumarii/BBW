'use strict';

/**
 * @namespace EmailSubscribe
 */

var server = require('server');
server.extend(module.superModule);
var commonHelper = require('*/cartridge/scripts/helpers/commonHelpers');
var Transaction = require('dw/system/Transaction');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var EncryptionHelper = require('*/cartridge/scripts/helpers/encryptionHelpers');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var CustomerMgr = require('dw/customer/CustomerMgr');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

/**
 * Checks if the email value entered is correct format
 * @param {string} email - email string to check if valid
 * @returns {boolean} Whether email is valid
 */
function validateEmail(email) {
    var regex = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    return regex.test(email);
}

/**
 * EmailSubscribe-Show : The EmailSubscribe-Show endpoint will show newsletter form and passes CSRF token.
 */
server.get('Show',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        res.render('/components/footer/newsletter');
        next();
    }
);


/**
 * EmailSubscribe-Subscribe : The EmailSubscribe-Subscribe enpoint allows the shopper to submit their eamil address to be added to a mailing list. OOB SFRA does not have a mailing list feature however this endpoint call a hook would allow for a customer to easily allow for custiomization
 */
server.replace('Subscribe',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Site = require('dw/system/Site');
        // To check ReCaptcha
        var verifyCaptchaHelper = require('*/cartridge/scripts/helpers/verifyCaptchaHelper');
        var isReCaptchaEnable =
        Site.getCurrent().getCustomPreferenceValue('enableGoogleRecaptcha');
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
                    msg: Resource.msg('error.message.recaptcha', 'common', null)
                });
                this.emit('route:Complete', req, res);
                return;
            }
        }
        // Newsletter subscription
        var email = req.form.emailId;

        if (email && validateEmail(email)) {

            var getCustomObject = CustomObjectMgr.getCustomObject('newsletterSubscriptions', email);

            if (!empty(getCustomObject) && getCustomObject.custom.email === email) {
            // email already exists.
                res.json({
                    success: true,
                    msg: Resource.msg('subscribe.email.exists', 'newsletter', null)
                });
            } else {
                var query = 'email = \'' + email + '\'';
                var getCustomerProfile = CustomerMgr.queryProfiles(query, null, null, 1, 1);
                if (getCustomerProfile.hasNext()) {
                    var customerProfile = getCustomerProfile.next();
                    Transaction.wrap(function () {
                    // assign values to the customer profile
                        customerProfile.custom.newsletterSubscriptionStatus = true;
                    });
                }

                // create cutome object
                Transaction.wrap(function () {
                    var newSubscriber = CustomObjectMgr.createCustomObject('newsletterSubscriptions', email);
                    newSubscriber.custom.emailFrequency = Resource.msg('default.email.frequency', 'newsletter', null);
                    newSubscriber.custom.objectCreationTime = new Date();
                });

                getCustomObject = CustomObjectMgr.getCustomObject('newsletterSubscriptions', email);
                var encryptedNewsletterId = EncryptionHelper.encryptPin(getCustomObject.UUID);

                // send email to customer
                var userObj = {
                    email: email,
                    encryptedNewsletterId: encodeURIComponent(encryptedNewsletterId)
                };
                commonHelper.sendNewsLetterSubscribeEmail(userObj);

                res.json({
                    success: true,
                    msg: Resource.msg('subscribe.email.success', 'homePage', null)
                });
            }
        } else {
            res.json({
                error: true,
                msg: Resource.msg('subscribe.email.invalid', 'homePage', null)
            });
        }

        next();
    });

/**
 * EmailSubscribe-UnsubscribeShow : The EmailSubscribe-UnsubscribeShow is used for showing unsubscribe page to user
 */
server.get('UnsubscribeShow',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var id = decodeURIComponent(req.querystring.id);
        var renderTemplate = '/newsletter/unsubscribe';
        var actionUrl = URLUtils.url('EmailSubscribe-Unsubscribe');
        var changeFreqURL = URLUtils.url('EmailSubscribe-ChangeEmailFrequency');
        var decryptedNewsletterId = EncryptionHelper.decryptPin(id);
        var newsletterObject = CustomObjectMgr.describe('newsletterSubscriptions');
        var emailFrequency;

        if(decryptedNewsletterId){
            var getCustomObject = CustomObjectMgr.queryCustomObject('newsletterSubscriptions', 'UUID ILIKE {0}', decryptedNewsletterId);

            if (getCustomObject) {
                for (var index = 0; index < newsletterObject.attributeDefinitions.length; index++) {
                    if (newsletterObject.attributeDefinitions[index].ID === 'emailFrequency') {
                        emailFrequency = newsletterObject.attributeDefinitions[index].values;
                        break;
                    }
                }

                res.render(renderTemplate, {
                    actionUrl: actionUrl,
                    changeFreqURL: changeFreqURL,
                    email: getCustomObject.custom.email,
                    id: getCustomObject.UUID,
                    emailFrequency: emailFrequency
                });
            } else {
                res.setStatusCode(404);
                res.render('error/notFound');
            }
        }else{
            res.setStatusCode(404);
            res.render('error/notFound');
        }

        next();
    });

/**
 * EmailSubscribe-Unsubscribe : The EmailSubscribe-Unsubscribe is used for unsubscribe user from newsletter
 */
server.post('Unsubscribe',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function( req, res, next) {
        var email = req.form.userEmail;
        var customObject = CustomObjectMgr.getCustomObject('newsletterSubscriptions', email);
        if(customObject){
            Transaction.wrap(function () {
                CustomObjectMgr.remove(customObject);
            });
            var query = 'email = \'' + email + '\'';
            var getCustomerProfile = CustomerMgr.queryProfiles(query, null, null, 1, 1);
            if (getCustomerProfile.hasNext()) {
                var customerProfile = getCustomerProfile.next();
                Transaction.wrap(function () {
                    // assign values to the customer profile
                    customerProfile.custom.newsletterSubscriptionStatus = false;
                });
            }
        }
        res.render('/newsletter/thankYou');
        next();
    });

/**
 * EmailSubscribe-ChangeEmailFrequency : The EmailSubscribe-ChangeEmailFrequency change the frequency of the newsletter emails
 */
server.post('ChangeEmailFrequency',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function( req, res, next) {
        var email = req.form.userEmail;
        var emailFrequency = req.form.emailFrequency;
        if(emailFrequency && email !== null){
            var customObject = CustomObjectMgr.getCustomObject('newsletterSubscriptions', email);
            if(customObject){
                Transaction.wrap(function () {
                    customObject.custom.emailFrequency = emailFrequency;
                });
            }
        }
        res.render('/newsletter/thankYou');
        next();
    });

module.exports = server.exports();
