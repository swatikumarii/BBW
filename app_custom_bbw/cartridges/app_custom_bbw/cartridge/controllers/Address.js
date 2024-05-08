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
});

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

        res.render('account/addressForm', {
            addressForm: addressForm,
            addressId: addressId
        });

        next();
    }
);

/**
 * Append Address-SaveAddress controller: Update rediection url
 */
server.append('SaveAddress', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();
        viewData.redirectUrl = URLUtils.url('Address-List','showstatusmsg', true).toString();
        res.setViewData(viewData);
    });
    next();
});

module.exports = server.exports();
