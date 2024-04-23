'use strict';

/**
 * @namespace Account
 */

var server = require('server');
server.extend(module.superModule);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Append Account-Show controller: Update breadcrumbs
 */
server.append('Show', function (req, res, next) {
    var viewData = res.getViewData();
    var breadcrumbs = [
        {
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
 * Account-EditProfile : The Account-EditProfile endpoint is use with append function to append
 * custom profile param to load on profile page
 */

server.append('EditProfile', function (req, res, next) {
    var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');
    var accountModel = accountHelpers.getAccountModel(req);

    var viewData = res.getViewData();
    var profileModel = {
        dob: accountModel.profile.birthday
            ? Date(accountModel.profile.birthday)
            : '',
        zip: accountModel.profile.zipCode,
        emailconfirm: accountModel.profile.email
    };
    viewData.successMessage = false;
    if (req.querystring.profile && req.querystring.profile === 'success') {
        viewData.successMessage = true;
    }

    var breadcrumbs = [
        {
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
    viewData.breadcrumbs = breadcrumbs;
    viewData.profileForm.copyFrom(profileModel);
    viewData.profile = accountModel.profile;
    res.setViewData(viewData);

    next();
});

/**
 * Account-Login : The Account-Login endpoint will render the shopper's account page. Once a shopper logs in they will see is a dashboard that displays profile, address, payment and order information.
 */
server.prepend('Login', function (req, res, next) {
    var Site = require('dw/system/Site');
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

        var result = {
            firstName: profileForm.customer.firstname.value,
            lastName: profileForm.customer.lastname.value,
            phone: profileForm.customer.phone.value,
            email: profileForm.customer.email.value,
            confirmEmail: profileForm.customer.emailconfirm.value,
            password: profileForm.login.password.value,
            zipCode: profileForm.customer.zip.value,
            profileForm: profileForm
        };
        if (profileForm.valid) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function (req, res) {  // eslint-disable-line no-shadow
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
        return next();
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

        var profileForm = server.forms.getForm('profile');
        var newPasswords = profileForm.login.newpasswords;
        // form validation
        // if (newPasswords.newpassword.value !== newPasswords.newpasswordconfirm.value) {
        //     profileForm.valid = false;
        //     newPasswords.newpassword.valid = false;
        //     newPasswords.newpasswordconfirm.valid = false;
        //     newPasswords.newpasswordconfirm.error = Resource.msg(
        //         'error.message.mismatch.newpassword',
        //         'forms',
        //         null
        //     );
        // }

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
        return next();
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


server.get(
    'Orders',
    server.middleware.https,
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var ordersResult = OrderHelpers.getOrders(
            req.currentCustomer,
            req.querystring,
            req.locale.id
        );
        var orderModel = [];
        var orders = ordersResult.orders;

        if (orders && orders.length) {
            orders.forEach(function (item, index) {
                req.querystring.orderID = orders[index].orderNumber;
                orderModel.push(OrderHelpers.getOrderDetails(req));
            });
        }

        var viewData = res.getViewData();
        viewData.orders = orders;
        res.setViewData(viewData);
        next();
    }
);
module.exports = server.exports();
