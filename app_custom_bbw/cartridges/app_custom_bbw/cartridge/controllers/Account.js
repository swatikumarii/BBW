'use strict';

/**
 * @namespace Account
 */

var server = require('server');
server.extend(module.superModule);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');


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
                    msg: Resource.msg('error.message.recaptcha', 'common', null)
                });
                this.emit('route:Complete', req, res);
                return;
            }
        }
        next();
    }
);

/**
 * Account-Login : The Account-Login endpoint will render the shopper's account page. Once a shopper logs in they will see is a dashboard that displays profile, address, payment and order information.
 */
server.append(
    'Login',
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');  
        var BasketMgr = require('dw/order/BasketMgr');
        var loginRedirectExceptions = require('*/cartridge/config/loginRedirectExceptions');
        var storedBasket = BasketMgr.getStoredBasket();
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var storedBasketProductQuantities =
            storedBasket ? storedBasket.getAllProductQuantities().length : 0;
        var currentBasketProductQuantities =
            currentBasket ? currentBasket.getAllProductQuantities().length : 0;
        var loginRedirectUrl = req.form.loginRedirectUrl;
        var loginRedirectQueryString = req.form.loginRedirectQueryString || false;
        var queryStringArr =
            loginRedirectQueryString ? loginRedirectQueryString.split('=') : [];
        loginRedirectUrl = loginRedirectExceptions.includes(loginRedirectUrl)
            ? 'Account-Show'
            : loginRedirectUrl;
        loginRedirectUrl = URLUtils.url(loginRedirectUrl, queryStringArr);;
        var viewData = res.getViewData();
        viewData.redirectUrl = loginRedirectUrl.toString();
        viewData.showCartMergePopup =
            storedBasketProductQuantities && currentBasketProductQuantities;
        next();
    }
);

/**
 * Account-SubmitRegistration : The Account-SubmitRegistration endpoint is the endpoint that gets hit when a shopper submits their registration for a new account
 */
server.replace(
    'SubmitRegistration',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Site = require('dw/system/Site');
        var Resource = require('dw/web/Resource');
        var CustomerMgr = require('dw/customer/CustomerMgr');
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
                    msg: Resource.msg('error.message.recaptcha', 'common', null)
                });
                this.emit('route:Complete', req, res);
                return;
            }
        }
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        var formErrors = require('*/cartridge/scripts/formErrors');

        var registrationForm = server.forms.getForm('profile');
        var checkbox = req.form.checked;
        var registrationFormErrors = formErrors.getFormErrors(registrationForm);
        if (Object.keys(registrationFormErrors).length > 0) {
            res.json({ fields: formErrors.getFormErrors(registrationForm) });
        } else {
            var birthdayArray =
                registrationForm.customer.dob.value.split('/');

            var birthday = new Date(
                birthdayArray[1] +
                    '/' +
                    birthdayArray[0] +
                    '/' +
                    birthdayArray[2]
            );
            var currentDate = new Date();
            var birthdayTimestamp = birthday.getTime();
            var todayTimeStamp = currentDate.getTime();
            var diff = (todayTimeStamp - birthdayTimestamp) / (86400000 * 365);
            if (diff < 0) {
                registrationForm.customer.dob.valid = false;
                registrationForm.customer.don.error = Resource.msg(
                    'error.message.dob.required',
                    'forms',
                    null
                );
                registrationForm.valid = false;
            }
            if (birthday > currentDate) {
                registrationForm.customer.dob.valid = false;
                registrationForm.customer.dob.error = Resource.msg(
                    'error.message.dob.required',
                    'forms',
                    null
                );
                registrationForm.valid = false;
            }

            if (!accountHelpers.isValidDate(birthdayArray)) {
                registrationForm.customer.dob.valid = false;
                registrationForm.customer.dob.error = Resource.msg(
                    'error.message.dob.invaliddate',
                    'forms',
                    null
                );
                registrationForm.valid = false;
            }

            var gender;
            if (registrationForm.customer.gender.value === 'Male') {
                gender = 1;
            }
            if (registrationForm.customer.gender.value === 'Female') {
                gender = 2;
            }
            if (registrationForm.customer.gender.value === 'Other') {
                gender = 3;
            }

            if (
                registrationForm.customer.email.value.toLowerCase() !==
                registrationForm.customer.emailconfirm.value.toLowerCase()
            ) {
                registrationForm.customer.email.valid = false;
                registrationForm.customer.emailconfirm.valid = false;
                registrationForm.customer.emailconfirm.error = Resource.msg(
                    'error.message.mismatch.email',
                    'forms',
                    null
                );
                registrationForm.valid = false;
            }

            if (
                registrationForm.login.password.value !==
                registrationForm.login.passwordconfirm.value
            ) {
                registrationForm.login.password.valid = false;
                registrationForm.login.passwordconfirm.valid = false;
                registrationForm.login.passwordconfirm.error = Resource.msg(
                    'error.message.mismatch.password',
                    'forms',
                    null
                );
                registrationForm.valid = false;
            }

            if (
                !CustomerMgr.isAcceptablePassword(
                    registrationForm.login.password.value
                )
            ) {
                registrationForm.login.password.valid = false;
                registrationForm.login.passwordconfirm.valid = false;
                registrationForm.login.passwordconfirm.error = Resource.msg(
                    'error.message.password.constraints.not.matched',
                    'forms',
                    null
                );
                registrationForm.valid = false;
            }
            if (checkbox === 'false') {
                registrationForm.valid = false;
            }
            
            var registrationFormObj = {
                salutation: registrationForm.customer.salutation.value,
                firstName: registrationForm.customer.firstname.value,
                lastName: registrationForm.customer.lastname.value,
                phone: registrationForm.customer.phone.value,
                email: registrationForm.customer.email.value,
                emailConfirm: registrationForm.customer.emailconfirm.value,
                gender: gender,
                birthday: birthday,
                zipCode: registrationForm.customer.zip.value,
                nationality: registrationForm.customer.nationality.value,
                password: registrationForm.login.password.value,
                passwordConfirm: registrationForm.login.passwordconfirm.value,
                validForm: registrationForm.valid,
                form: registrationForm
            };

            if (registrationForm.valid) {
                res.setViewData(registrationFormObj);

                this.on('route:BeforeComplete', function (request, respose) {
                    // eslint-disable-line no-shadow
                    var Transaction = require('dw/system/Transaction');
                    var accountHelper = require('*/cartridge/scripts/helpers/accountHelpers');
                    var authenticatedCustomer;
                    var serverError;

                    // getting variables for the BeforeComplete function
                    var registrationForm = respose.getViewData(); // eslint-disable-line

                    if (registrationForm.validForm) {
                        var login = registrationForm.email;
                        var password = registrationForm.password;

                        // attempt to create a new user and log that user in.
                        try {
                            Transaction.wrap(function () {
                                var error = {};
                                var newCustomer = CustomerMgr.createCustomer(
                                    login,
                                    password
                                );

                                var authenticateCustomerResult =
                                    CustomerMgr.authenticateCustomer(
                                        login,
                                        password
                                    );
                                if (
                                    authenticateCustomerResult.status !==
                                    'AUTH_OK'
                                ) {
                                    error = {
                                        authError: true,
                                        status: authenticateCustomerResult.status
                                    };
                                    throw error;
                                }

                                authenticatedCustomer =
                                    CustomerMgr.loginCustomer(
                                        authenticateCustomerResult,
                                        false
                                    );

                                if (!authenticatedCustomer) {
                                    error = {
                                        authError: true,
                                        status: authenticateCustomerResult.status
                                    };
                                    throw error;
                                } else {
                                    // assign values to the profile
                                    var newCustomerProfile =
                                        newCustomer.getProfile();

                                    newCustomerProfile.salutation = registrationForm.salutation;
                                    newCustomerProfile.firstName = registrationForm.firstName;
                                    newCustomerProfile.lastName = registrationForm.lastName;
                                    newCustomerProfile.phoneHome = registrationForm.phone;
                                    newCustomerProfile.email = registrationForm.email;
                                    newCustomerProfile.gender = registrationForm.gender;
                                    newCustomerProfile.birthday = registrationForm.birthday;
                                    newCustomerProfile.custom.zipCode = registrationForm.zipCode;
                                    newCustomerProfile.custom.nationality = registrationForm.nationality;
                                }
                            });
                        } catch (e) {
                            if (e.authError) {
                                serverError = true;
                            } else {
                                registrationForm.validForm = false;
                                registrationForm.form.customer.email.valid = false;
                                registrationForm.form.customer.emailconfirm.valid = false;
                                registrationForm.form.customer.email.error =
                                    Resource.msg(
                                        'error.message.username.invalid',
                                        'forms',
                                        null
                                    );
                            }
                        }
                    }

                    delete registrationForm.password;
                    delete registrationForm.passwordConfirm;
                    formErrors.removeFormValues(registrationForm.form);

                    if (serverError) {
                        respose.setStatusCode(500);
                        respose.json({
                            success: false,
                            errorMessage: Resource.msg(
                                'error.message.unable.to.create.account',
                                'login',
                                null
                            )
                        });

                        return;
                    }

                    if (registrationForm.validForm) {
                        // send a registration email
                        accountHelper.sendCreateAccountEmail(
                            authenticatedCustomer.profile
                        );

                        respose.setViewData({
                            authenticatedCustomer: authenticatedCustomer
                        });
                        respose.json({
                            success: true,
                            redirectUrl: accountHelper.getLoginRedirectURL(
                                request.querystring.rurl,
                                request.session.privacyCache,
                                true
                            )
                        });

                        request.session.privacyCache.set('args', null);
                    } else {
                        respose.json({
                            fields: formErrors.getFormErrors(registrationForm)
                        });
                    }
                });
            } else {
                res.json({
                    fields: formErrors.getFormErrors(registrationForm)
                });
            }

        }
        // form validation
        

        // setting variables for the BeforeComplete function
        
        
        next();
    }
);

module.exports = server.exports();
