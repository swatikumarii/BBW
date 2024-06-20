'use strict';

/**
 * @namespace Account
 */

var server = require('server');
server.extend(module.superModule);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var ContentMgr = require('dw/content/ContentMgr');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
var emailContentHelpers = require('*/cartridge/scripts/helpers/emailContentHelpers');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

/**
 * Append Account-Show controller: Update breadcrumbs
 */
server.append('Show', function (req, res, next) {
    var viewData = res.getViewData();
    var breadcrumbs = [{
        htmlValue: Resource.msg('global.home', 'common', null),
        url: URLUtils.home().toString()
    },
    {
        htmlValue: Resource.msg('page.title.myaccount', 'account', null),
        url: URLUtils.url('Account-Show').toString()
    }
    ];
    viewData.breadcrumbs = breadcrumbs;

    res.setViewData(viewData);

    next();
});

/**
 * Account-EditProfile : The Account-EditProfile to get the birthday and zipcode
 */

server.append('EditProfile', function (req, res, next) {
    var Site = require('dw/system/Site');
    var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');
    var accountModel = accountHelpers.getAccountModel(req);

    var viewData = res.getViewData();
    var birthday = '-';

    if (accountModel.profile.birthday) {
        var dob = accountModel.profile.birthday.toLocaleString('en-US', {
            month: 'long'
        });
        var birthdayArray = dob.split(', ');
        birthday = birthdayArray[0];
    }

    var profileModel = {
        dob: birthday,
        zipCode: accountModel.profile.zipCode,
        salutation: accountModel.profile.salutation,
        nationality: accountModel.profile.nationality,
        gender: accountModel.profile.gender,
        emailconfirm: accountModel.profile.email
    };

    var breadcrumbs = [{
        htmlValue: Resource.msg('global.home', 'common', null),
        url: URLUtils.home().toString()
    },
    {
        htmlValue: Resource.msg('page.title.myaccount', 'account', null),
        url: URLUtils.url('Account-Show').toString()
    },
    {
        htmlValue: Resource.msg('label.profile.info', 'account', null),
        url: URLUtils.url('Account-EditProfile').toString()
    }
    ];

    var nationalityCO = Site.getCurrent().getCustomPreferenceValue('nationalities');
    var nationalities = nationalityCO.length > 0 ? nationalityCO.split(',') : [];
    viewData.breadcrumbs = breadcrumbs;
    viewData.profileForm.copyFrom(profileModel);
    viewData.nationalities = nationalities;
    viewData.profile = accountModel.profile;
    res.setViewData(viewData);

    next();
});

/**
 * Account-Login : The Account-Login endpoint will render the shopper's account page. Once a shopper logs in they will see is a dashboard that displays profile, address, payment and order information.
 */
server.prepend('Login', function (req, res, next) {
    var Site = require('dw/system/Site');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
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
    if (accountHelpers.handleMigratedCustomers(req.form.loginEmail)) {
        res.json({
            isMigratedNotUpdated: true,
            error: [
                Resource.msg(
                    'reset.password.message.migrated.user',
                    'login',
                    null
                )
            ]
        });
        this.emit('route:Complete', req, res);
    } else {
        next();
    }
});

/**
 * Account-Login : The Account-Login endpoint will render the shopper's account page. Once a shopper logs in they will see is a dashboard that displays profile, address, payment and order information.
 */
server.append('Login', function (req, res, next) {
    var accountHelper = require('*/cartridge/scripts/helpers/accountHelpers');
    var email = req.form.loginEmail;
    var viewData = res.getViewData();
    var remainingLoginAttempts = accountHelper.remainingLoginAttempts(email);
    if(remainingLoginAttempts !== -1){
        viewData.error =
            [
                Resource.msgf('error.message.login.form.attempts', 'login', null, remainingLoginAttempts)
            ];
    
        if(!remainingLoginAttempts || remainingLoginAttempts === 0){
            viewData.error = [
                Resource.msg('error.message.account.locked', 'login', null)
            ];
        }
        viewData.remainingLoginAttempts = remainingLoginAttempts;
        res.setViewData(viewData);
    }
    next();
});


server.replace(
    'SaveProfile',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

        var formErrors = require('*/cartridge/scripts/formErrors');
        var Site = require('dw/system/Site');
        var verifyCaptchaHelper = require('*/cartridge/scripts/helpers/verifyCaptchaHelper');

        var isReCaptchaEnable = Site.getCurrent().getCustomPreferenceValue(
            'enableGoogleRecaptcha'
        );
        if (isReCaptchaEnable) {
            var recaptchaResponse = req.httpParameterMap
                .get('g-recaptcha-response')
                .getStringValue();

            var pageScore = verifyCaptchaHelper.pageScore('editProfile');
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
        var profileForm = server.forms.getForm('profile');

        // form validation
        if (
            profileForm.customer.email.value.toLowerCase() !==
            profileForm.customer.emailconfirm.value.toLowerCase()
        ) {
            profileForm.valid = false;
            profileForm.customer.email.valid = false;
            profileForm.customer.emailconfirm.valid = false;
            profileForm.customer.emailconfirm.error = Resource.msg(
                'error.message.mismatch.email',
                'forms',
                null
            );
        }

        var gender;
        if (profileForm.customer.gender.htmlValue === 'Male') {
            gender = 1;
        }
        if (profileForm.customer.gender.htmlValue === 'Female') {
            gender = 2;
        }
        if (profileForm.customer.gender.htmlValue === 'Other') {
            gender = 3;
        }

        var result = {
            salutation: profileForm.customer.salutation.value,
            gender: gender,
            nationality: profileForm.customer.nationality.value,
            firstName: profileForm.customer.firstname.value,
            lastName: profileForm.customer.lastname.value,
            phone: profileForm.customer.phone.value,
            email: profileForm.customer.email.value,
            confirmEmail: profileForm.customer.emailconfirm.value,
            password: profileForm.login.password.value,
            zipCode: profileForm.customer.zipCode.value,
            profileForm: profileForm
        };
        if (profileForm.valid) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var formInfo = res.getViewData();
                var customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                );
                var profile = customer.getProfile();
                var customerLogin;
                var status;

                Transaction.wrap(function () {
                    status = profile.credentials.setPassword(
                        formInfo.password,
                        formInfo.password,
                        true
                    );

                    if (status.error) {
                        formInfo.profileForm.login.password.valid = false;
                        formInfo.profileForm.login.password.error =
                            Resource.msg(
                                'error.message.currentpasswordnomatch',
                                'forms',
                                null
                            );
                    } else {
                        customerLogin = profile.credentials.setLogin(
                            formInfo.email,
                            formInfo.password
                        );
                    }
                });

                delete formInfo.password;
                delete formInfo.confirmEmail;

                if (customerLogin) {
                    Transaction.wrap(function () {
                        profile.setFirstName(formInfo.firstName);
                        profile.setLastName(formInfo.lastName);
                        profile.setEmail(formInfo.email);
                        profile.setPhoneHome(formInfo.phone);
                        profile.custom.zipCode = formInfo.zipCode;
                        profile.setGender(formInfo.gender);
                        profile.salutation = formInfo.salutation;
                        profile.custom.nationality = formInfo.nationality;
                        profile.custom.isProfileComplete = true;
                    });

                    // Send account edited email
                    accountHelpers.sendAccountEditedEmail(customer.profile);

                    delete formInfo.profileForm;
                    delete formInfo.email;

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url(
                            'Account-EditProfile',
                            'profile',
                            'success'
                        ).toString()
                    });

                } else {
                    if (!status.error) {
                        formInfo.profileForm.customer.email.valid = false;
                        formInfo.profileForm.customer.email.error =
                            Resource.msg(
                                'error.message.username.invalid',
                                'forms',
                                null
                            );
                    }

                    delete formInfo.profileForm;
                    delete formInfo.email;

                    res.json({
                        success: false,
                        fields: formErrors.getFormErrors(profileForm)
                    });
                }
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(profileForm)
            });
        }
        next();
    }
);

server.replace(
    'SavePassword',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var CustomerMgr = require('dw/customer/CustomerMgr');

        var formErrors = require('*/cartridge/scripts/formErrors');
        var Site = require('dw/system/Site');
        var verifyCaptchaHelper = require('*/cartridge/scripts/helpers/verifyCaptchaHelper');

        var isReCaptchaEnable = Site.getCurrent().getCustomPreferenceValue(
            'enableGoogleRecaptcha'
        );
        if (isReCaptchaEnable) {
            var recaptchaResponse = req.httpParameterMap
                .get('g-recaptcha-response')
                .getStringValue();

            var pageScore = verifyCaptchaHelper.pageScore('savePassword');
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

        var profileForm = server.forms.getForm('profile');
        var newPasswords = profileForm.login.newpasswords;

        var result = {
            currentPassword: profileForm.login.currentpassword.value,
            newPassword: newPasswords.newpassword.value,
            profileForm: profileForm
        };

        if (profileForm.valid) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function () {
                // eslint-disable-line no-shadow
                var formInfo = res.getViewData();
                var customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                );
                var status;
                Transaction.wrap(function () {
                    status = customer.profile.credentials.setPassword(
                        formInfo.newPassword,
                        formInfo.currentPassword,
                        true
                    );
                });
                if (status.error) {
                    if (
                        !CustomerMgr.isAcceptablePassword(
                            newPasswords.newpassword.value
                        )
                    ) {
                        formInfo.profileForm.login.newpasswords.newpassword.valid = false;
                        formInfo.profileForm.login.newpasswords.newpassword.error =
                            Resource.msg(
                                'error.message.password.constraints.not.matched',
                                'forms',
                                null
                            );
                    } else {
                        formInfo.profileForm.login.currentpassword.valid = false;
                        formInfo.profileForm.login.currentpassword.error =
                            Resource.msg(
                                'error.message.currentpasswordnomatch',
                                'forms',
                                null
                            );
                    }

                    delete formInfo.currentPassword;
                    delete formInfo.newPassword;
                    delete formInfo.profileForm;

                    res.json({
                        success: false,
                        fields: formErrors.getFormErrors(profileForm)
                    });
                } else {
                    // Send account edited email
                    var email = customer.profile.email;
                    var url = URLUtils.https('Login-Show');

                    var emailContent = ContentMgr.getContent('password-reset-confrimation-mail'); // Password Change Confirmation Content Asset Id
                    var emailMarkup = '';

                    if (!empty(emailContent) && emailContent.online) {
                        emailMarkup = emailContent.custom.body.markup;
                        emailMarkup = emailMarkup.replace('{{customerName}}', customer.profile.firstName);
                        emailMarkup = emailMarkup.replace('{{myAccountLink}}', url);
                    }

                    var objectForEmail = {
                        firstName: customer.profile.firstName,
                        lastName: customer.profile.lastName,
                        url: url,
                        markup: emailMarkup,
                        content: emailContentHelpers.getEmailContent('normal-footer', 'email-header')
                    };

                    var emailObj = {
                        to: email,
                        subject: Resource.msg('subject.password.changed.email', 'login', null),
                        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
                        type: emailHelpers.emailTypes.passwordReset
                    };

                    emailHelpers.sendEmail(emailObj, 'mail/account/password/passwordChangedEmail', objectForEmail);

                    delete formInfo.currentPassword;
                    delete formInfo.newPassword;
                    delete formInfo.profileForm;

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url(
                            'Account-EditProfile',
                            'profile',
                            'success'
                        ).toString()
                    });
                }
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(profileForm)
            });
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
        var BasketMgr = require('dw/order/BasketMgr');
        var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
        var loginRedirectExceptions = require('*/cartridge/config/loginRedirectExceptions');
        var dynamicBadgeHelpers = require('*/cartridge/scripts/helpers/dynamicBadgeHelpers');
        var storedBasket = BasketMgr.getStoredBasket();
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var storedBasketProductQuantities =
            storedBasket ? storedBasket.getAllProductQuantities().length : 0;
        var storedBasketProducts = [];
        var currentBasketHasGiftProducts = qwikcilverHelpers.validateGiftProduct(currentBasket);
        var storedBasketHasGiftProducts = qwikcilverHelpers.validateGiftProduct(storedBasket);
        var productLineItemItr = storedBasket && storedBasket
            .getAllProductLineItems()
            .iterator();
        if (productLineItemItr) {
            while (productLineItemItr.hasNext()) {
                var pli = productLineItemItr.next();
                var mergeQty = pli.quantityValue;
                if (!pli.bundledProductLineItem && !pli.optionProductLineItem && !pli.custom.isEgiftCard) {
                    if (!pli.bonusProductLineItem) {
                        storedBasketProducts.push({
                            productID: pli.productID,
                            quantityValue: mergeQty,
                            bundledProductLineItem: pli.bundledProductLineItem,
                            optionProductLineItem: pli.optionProductLineItem
                        });
                    }
                }
                if (pli.custom.isEgiftCard) {
                    storedBasketProducts.push({
                        productID: pli.productID,
                        quantityValue: mergeQty,
                        bundledProductLineItem: pli.bundledProductLineItem,
                        optionProductLineItem: pli.optionProductLineItem,
                        isEgiftCard: true,
                        eGiftCardScheduleDay: pli.custom.eGiftCardScheduleDay,
                        eGiftCardScheduleMonth: pli.custom.eGiftCardScheduleMonth,
                        eGiftEmailPending: pli.custom.eGiftEmailPending,
                        eGiftMessage: pli.custom.eGiftMessage,
                        eGiftReceiver: pli.custom.eGiftReceiver,
                        eGiftReceiverEmail: pli.custom.eGiftReceiverEmail,
                        eGiftScheduledYear: pli.custom.eGiftScheduledYear,
                        eGiftSender: pli.custom.eGiftSender,
                        eGiftVideoLink: pli.custom.eGiftVideoLink || '',

                    });
                }
            }
        }
        var currentBasketProductQuantities =
            currentBasket ? currentBasket.getAllProductQuantities().length : 0;
        var loginRedirectUrl = req.form.loginRedirectUrl;
        var loginRedirectQueryString = req.form.loginRedirectQueryString || false;
        var queryStringArr =
            loginRedirectQueryString ? loginRedirectQueryString.split('=') : [];
        loginRedirectUrl = loginRedirectExceptions.includes(loginRedirectUrl) ?
            'Account-Show' :
            loginRedirectUrl;
        loginRedirectUrl = URLUtils.url(loginRedirectUrl, queryStringArr);
        var viewData = res.getViewData();
        var bothCartsHaveProducts =
            storedBasketProductQuantities && currentBasketProductQuantities;
        var bothCartsHaveGiftProducts =
            currentBasketHasGiftProducts && storedBasketHasGiftProducts;
        var neitherCartsHaveGiftProducts = !currentBasketHasGiftProducts && !storedBasketHasGiftProducts;
        viewData.redirectUrl = loginRedirectUrl.toString();
        viewData.showCartMergePopup = bothCartsHaveProducts && (bothCartsHaveGiftProducts || neitherCartsHaveGiftProducts);
        viewData.currentBasketHasGiftProducts = currentBasketHasGiftProducts;
        viewData.storedBasketHasGiftProducts = storedBasketHasGiftProducts;
        viewData.storedBasketProducts = storedBasketProducts;
        if (
            'authenticatedCustomer' in viewData &&
            viewData.authenticatedCustomer.authenticated
        ) {
            if (viewData.authenticatedCustomer.profile) {
                dynamicBadgeHelpers.updateCartDetailInProfile(
                    viewData.authenticatedCustomer.profile
                );
            }
            viewData.isIncomplete =
                'custom' in viewData.authenticatedCustomer.profile &&
                'isProfileComplete' in
                viewData.authenticatedCustomer.profile.custom ?
                    !viewData.authenticatedCustomer.profile.custom
                        .isProfileComplete :
                    true;
        }
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
            res.json({
                fields: formErrors.getFormErrors(registrationForm)
            });
        } else {
            var birthdayArray =
                registrationForm.customer.dob.value.split('-');

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
                registrationForm.customer.dob.error = Resource.msg(
                    'error.message.dob.invaliddate',
                    'forms',
                    null
                );
                registrationForm.valid = false;
            }
            if (birthday > currentDate) {
                registrationForm.customer.dob.valid = false;
                registrationForm.customer.dob.error = Resource.msg(
                    'error.message.dob.invaliddate',
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
                                    newCustomerProfile.custom.isProfileComplete = true;

                                    if (registrationForm.form.customer.addtoemaillist.checked) {
                                        var getCustomObject = CustomObjectMgr.getCustomObject('newsletterSubscriptions', newCustomerProfile.email);

                                        newCustomerProfile.custom.newsletterSubscriptionStatus = true;

                                        // create custom object
                                        if (!getCustomObject) {
                                            var newSubscriber = CustomObjectMgr.createCustomObject('newsletterSubscriptions', newCustomerProfile.email);
                                            newSubscriber.custom.email = newCustomerProfile.email;
                                            newSubscriber.custom.emailFrequency = Resource.msg('default.email.frequency', 'newsletter', null);
                                            newSubscriber.custom.objectCreationTime = new Date();
                                        }
                                    }
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
                        res.setStatusCode(500);
                        res.json({
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

                        res.setViewData({
                            authenticatedCustomer: authenticatedCustomer
                        });
                        res.json({
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

/**
 * Account-SaveNewPassword : The Account-SaveNewPassword endpoint handles resetting a shoppers password. This is the last step in the forgot password user flow. (This step does not log the shopper in.)
 * Base/Account-SaveNewPassword
 * @function
 * @memberof Account
 * @param {middleware} middleware - server.middleware.https
 * @param {httpparameter} httpparameter - token - SFRA utilizes this token to retrieve the shopper
 * @param {httpparameter} httpparameter - dwfrm_newPasswords_newpassword - Input field for the shopper's new password
 * @param {httpparameter} httpparameter - dwfrm_newPasswords_newpasswordconfirm  - Input field to confirm the shopper's new password
 * @param {httpparameter} httpparameter - save - unutilized param
 * @param {category} category - sensitive
 * @param {renders} renders - isml
 * @param {serverfunction} serverfunction - post
 */
server.replace('SaveNewPassword', server.middleware.https, function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var passwordForm = server.forms.getForm('newPasswords');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    // Token used to be a query parameter, now it's in the body. Support both.
    var token = req.form.token || req.querystring.Token;

    if (passwordForm.newpassword.value !== passwordForm.newpasswordconfirm.value) {
        passwordForm.valid = false;
        passwordForm.newpassword.valid = false;
        passwordForm.newpasswordconfirm.valid = false;
        passwordForm.newpasswordconfirm.error = Resource.msg('error.message.mismatch.newpassword', 'forms', null);
    }

    if (passwordForm.valid) {
        var result = {
            newPassword: passwordForm.newpassword.value,
            newPasswordConfirm: passwordForm.newpasswordconfirm.value,
            token: token,
            passwordForm: passwordForm
        };
        res.setViewData(result);
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var Site = require('dw/system/Site');

            var emailContent = ContentMgr.getContent('password-reset-confrimation-mail'); // Password Change Confirmation Content Asset Id
            var emailMarkup = '';

            var formInfo = res.getViewData();
            var status;
            var resettingCustomer;
            Transaction.wrap(function () {
                resettingCustomer = CustomerMgr.getCustomerByToken(formInfo.token);
                status = resettingCustomer.profile.credentials.setPasswordWithToken(
                    formInfo.token,
                    formInfo.newPassword
                );
            });
            if (status.error) {
                passwordForm.newpassword.valid = false;
                passwordForm.newpasswordconfirm.valid = false;
                passwordForm.newpasswordconfirm.error = Resource.msg('error.message.resetpassword.invalidformentry', 'forms', null);
                res.render('account/password/newPassword', {
                    passwordForm: passwordForm,
                    token: token
                });
            } else {
                var email = resettingCustomer.profile.email;
                var url = URLUtils.https('Login-Show');

                if (!empty(emailContent) && emailContent.online) {
                    emailMarkup = emailContent.custom.body.markup;
                    emailMarkup = emailMarkup.replace('{{customerName}}', resettingCustomer.profile.firstName);
                    emailMarkup = emailMarkup.replace('{{myAccountLink}}', url);
                }

                var objectForEmail = {
                    firstName: resettingCustomer.profile.firstName,
                    lastName: resettingCustomer.profile.lastName,
                    url: url,
                    markup: emailMarkup,
                    content: emailContentHelpers.getEmailContent('normal-footer', 'email-header')
                };

                var emailObj = {
                    to: email,
                    subject: Resource.msg('subject.password.changed.email', 'login', null),
                    from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
                    type: emailHelpers.emailTypes.passwordReset
                };

                emailHelpers.sendEmail(emailObj, 'mail/account/password/passwordChangedEmail', objectForEmail);
                res.redirect(URLUtils.url('Login-Show'));
                accountHelpers.updateMigratedUsersPasswordChangeFlag(
                    resettingCustomer
                );
            }
        });
    } else {
        res.render('account/password/newPassword', {
            passwordForm: passwordForm,
            token: token
        });
    }
    next();
});

/**
 * Account-PasswordResetDialogForm : The Account-PasswordResetDialogForm endpoint is the endpoint that gets hit once the shopper has clicked forgot password and has submitted their email address to request to reset their password
 */
server.replace('PasswordResetDialogForm', server.middleware.https, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

    var email = req.form.loginEmail;
    var errorMsg;
    var isValidEmail;
    var resettingCustomer;
    var mobile = req.querystring.mobile;
    var receivedMsgHeading = Resource.msg('label.resetpasswordreceived', 'login', null);
    var receivedMsgBody = Resource.msg('msg.requestedpasswordreset', 'login', null);
    var buttonText = Resource.msg('button.text.loginform', 'login', null);
    var returnUrl = URLUtils.url('Login-Show').toString();
    if (email) {
        isValidEmail = emailHelpers.validateEmail(email);
        if (isValidEmail) {
            resettingCustomer = CustomerMgr.getCustomerByLogin(email);
            if (resettingCustomer) {
                if (
                    resettingCustomer.profile.custom &&
                    'lastForgotPasswordRequest' in
                        resettingCustomer.profile.custom &&
                    resettingCustomer.profile.custom.lastForgotPasswordRequest &&
                    (new Date() - resettingCustomer.profile.custom.lastForgotPasswordRequest) < 60000
                ) {
                    errorMsg = Resource.msg('error.message.passwordreset.within.one.min', 'login', null);
                    res.json({
                        fields: {
                            loginEmail: errorMsg
                        }
                    });
                } else {
                    accountHelpers.sendPasswordResetEmail(email, resettingCustomer);
                    Transaction.wrap(function () {
                        resettingCustomer.profile.custom.lastForgotPasswordRequest =
                                new Date();
                    });
                    res.json({
                        success: true,
                        receivedMsgHeading: receivedMsgHeading,
                        receivedMsgBody: receivedMsgBody,
                        buttonText: buttonText,
                        mobile: mobile === 'true',
                        returnUrl: returnUrl
                    });
                }
            } else {
                res.json({
                    success: true,
                    receivedMsgHeading: receivedMsgHeading,
                    receivedMsgBody: receivedMsgBody,
                    buttonText: buttonText,
                    mobile: mobile === 'true',
                    returnUrl: returnUrl
                });
            }
        } else {
            errorMsg = Resource.msg('error.message.passwordreset', 'login', null);
            res.json({
                fields: {
                    loginEmail: errorMsg
                }
            });
        }
    } else {
        errorMsg = Resource.msg('error.message.required', 'login', null);
        res.json({
            fields: {
                loginEmail: errorMsg
            }
        });
    }
    next();
});

module.exports = server.exports();
