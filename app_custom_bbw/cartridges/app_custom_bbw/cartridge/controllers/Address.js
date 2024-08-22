'use strict';

/**
 * @namespace Address
 */

var server = require('server');
server.extend(module.superModule);
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var seo = require('*/cartridge/scripts/middleware/seo');

/**
 * Append Address-List controller: Update breadcrumbs
 */
server.append('List', function (req, res, next) {
    var viewData = res.getViewData();
    var addressForm = server.forms.getForm('address');
    addressForm.clear();
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
            htmlValue: Resource.msg('label.addressbook', 'account', null),
            url: URLUtils.url('Address-List').toString()
        }
    ];
    viewData.showSuccessMessage = req.querystring.showstatusmsg;
    viewData.breadcrumbs = breadcrumbs;
    viewData.addressForm = addressForm;
    res.setViewData(viewData);
    next();
}, seo.addCurrentPageMetaData);

/**
 * Replace Address-EditAddress controller: changed the rendring template
 */
server.replace(
    'EditAddress',
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var AddressModel = require('*/cartridge/models/address');

        var addressId = req.querystring.addressId;
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var addressBook = customer.getProfile().getAddressBook();
        var rawAddress = addressBook.getAddress(addressId);
        var addressModel = new AddressModel(rawAddress);
        var addressForm = server.forms.getForm('address');
        addressForm.clear();

        addressForm.copyFrom(addressModel.address);

        res.render('account/editAddressForm', {
            addressForm: addressForm,
            addressId: addressId
        });

        next();
    }
);

/**
 * Replace Address-DeleteAddress controller: to send email
 */
server.replace(
    'SaveAddress',
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Transaction = require('dw/system/Transaction');
        var formErrors = require('*/cartridge/scripts/formErrors');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');

        var Site = require('dw/system/Site');
        var verifyCaptchaHelper = require('*/cartridge/scripts/helpers/verifyCaptchaHelper');

        var isReCaptchaEnable = Site.getCurrent().getCustomPreferenceValue(
            'enableGoogleRecaptcha'
        );
        if (isReCaptchaEnable) {
            var recaptchaResponse = req.httpParameterMap
                .get('g-recaptcha-response')
                .getStringValue();

            var pageScore = verifyCaptchaHelper.pageScore('address');
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

        var addressForm = server.forms.getForm('address');
        var addressFormObj = addressForm.toObject();
        addressFormObj.addressForm = addressForm;
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var addressBook = customer.getProfile().getAddressBook();
        if (addressForm.valid) {
            res.setViewData(addressFormObj);
            this.on('route:BeforeComplete', function () {
                // eslint-disable-line no-shadow
                var formInfo = res.getViewData();
                Transaction.wrap(function () {
                    var address = null;
                    if (
                        formInfo.addressId.equals(req.querystring.addressId) ||
                        !addressBook.getAddress(formInfo.addressId)
                    ) {
                        address = req.querystring.addressId
                            ? addressBook.getAddress(req.querystring.addressId)
                            : addressBook.createAddress(formInfo.addressId);
                    }

                    if (address) {
                        if (req.querystring.addressId) {
                            address.setID(formInfo.addressId);
                        }

                        // Save form's address
                        addressHelpers.updateAddressFields(address, formInfo);

                        if (req.querystring.addressId) {
                            // Send address edited email
                            accountHelpers.sendEditAddressEmail(customer.profile);
                        }else{
                            // Send address added email
                            accountHelpers.sendAddAddressEmail(customer.profile);
                        }

                        res.json({
                            success: true,
                            redirectUrl: URLUtils.url('Address-List','showstatusmsg', true).toString()
                        });
                    } else {
                        formInfo.addressForm.valid = false;
                        formInfo.addressForm.addressId.valid = false;
                        formInfo.addressForm.addressId.error = Resource.msg(
                            'error.message.idalreadyexists',
                            'forms',
                            null
                        );
                        res.json({
                            success: false,
                            fields: formErrors.getFormErrors(addressForm)
                        });
                    }
                });
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(addressForm)
            });
        }
        next();
    }
);

/**
 * Replace Address-DeleteAddress controller: to send email
 */
server.replace(
    'DeleteAddress',
    userLoggedIn.validateLoggedInAjax,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Transaction = require('dw/system/Transaction');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

        var data = res.getViewData();
        if (data && !data.loggedin) {
            res.json();
            return next();
        }

        var addressId = req.querystring.addressId;
        var isDefault = req.querystring.isDefault;
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var addressBook = customer.getProfile().getAddressBook();
        var address = addressBook.getAddress(addressId);
        var UUID = address.getUUID();
        this.on('route:BeforeComplete', function () {
            // eslint-disable-line no-shadow
            var length;
            Transaction.wrap(function () {
                addressBook.removeAddress(address);
                length = addressBook.getAddresses().length;
                if (isDefault && length > 0) {
                    var newDefaultAddress = addressBook.getAddresses()[0];
                    addressBook.setPreferredAddress(newDefaultAddress);
                }
            });

            // Send account edited email
            accountHelpers.sendDeleteAddressEmail(customer.profile);

            if (length === 0) {
                res.json({
                    UUID: UUID,
                    redirectUrl: URLUtils.url(
                        'Address-List',
                        'showstatusmsg',
                        true
                    ).toString(),
                    defaultMsg: Resource.msg(
                        'label.addressbook.defaultaddress',
                        'account',
                        null
                    ),
                    message: Resource.msg(
                        'msg.no.saved.addresses',
                        'address',
                        null
                    )
                });
            } else {
                res.json({
                    UUID: UUID,
                    redirectUrl: URLUtils.url(
                        'Address-List',
                        'showstatusmsg',
                        true
                    ).toString(),
                    defaultMsg: Resource.msg(
                        'label.addressbook.defaultaddress',
                        'account',
                        null
                    )
                });
            }
        });
        return next();
    }
);

module.exports = server.exports();
