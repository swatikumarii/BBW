'use strict';

/**
 * @namespace Address
 */

var server = require('server');
server.extend(module.superModule);
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

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
    viewData.breadcrumbs = breadcrumbs;
    viewData.addressForm = addressForm;
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
