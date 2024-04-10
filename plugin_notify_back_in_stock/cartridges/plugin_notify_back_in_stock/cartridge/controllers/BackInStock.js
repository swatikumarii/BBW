'use strict';

/**
 * @namespace BackInStock
 */

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

/**
 * BackInStock-CheckLogin : Check whether the user is registered or not plus whether the product is available or not
 */
server.post('CheckLogin', function (req, res, next) {
    var productID = req.form.pid;
    var ProductMgr = require('dw/catalog/ProductMgr');
    var product = ProductMgr.getProduct(productID);
    var ATS = product.availabilityModel.inventoryRecord.ATS;
    var productLevelReserveQty =
        'custom' in product &&
        'reserveQty' in product.custom &&
        product.custom.reserveQty
            ? product.custom.reserveQty
            : 0;
    var globalLevelReserveQty =
        dw.system.Site.getCurrent().getCustomPreferenceValue('reserveQty');
    var reserveOosQty = productLevelReserveQty || globalLevelReserveQty;
    var availableQty = reserveOosQty ? (ATS - reserveOosQty) : ATS;

    res.json({
        available: availableQty > 0,
        message: Resource.msg('product.available', 'notifyMe', null),
        registered: req.currentCustomer.raw.registered,
        notifyURL: URLUtils.url('BackInStock-Notify')
    });
    next();
});

/**
 * BackInStock-Notify : Store user email & product id to send email notification whenever product is available
 */
server.post('Notify', function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var userEmail = req.currentCustomer.raw.registered ? req.currentCustomer.profile.email : req.form.notifyMeEmail.toLowerCase();
    var productID = req.form.pid;
    var registered = req.currentCustomer.raw.registered;
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Transaction = require('dw/system/Transaction');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var productRecord = CustomObjectMgr.getCustomObject('notifyBackInStock', productID);
    var flag = false;
    var currentTime = new Date().toLocaleString();
    var profile = CustomerMgr.getCustomerByLogin(userEmail);
    var userObject = {
        email: userEmail,
        registered: profile && profile.registered ? 'yes' : 'no',
        timeStamp: currentTime
    };
    var emailObject = [];
    var product = ProductMgr.getProduct(productID);
    if (product) {
        emailObject.push(userObject);
        if (productRecord === null) {
            Transaction.wrap(function () {
                var newBackInStock = CustomObjectMgr.createCustomObject('notifyBackInStock', productID);
                newBackInStock.custom.user = JSON.stringify(emailObject);
            });
            flag = true;
        } else if (productRecord.custom.user.indexOf(userEmail) === -1) {
            var existsingUserObj = JSON.parse(productRecord.custom.user);
            existsingUserObj.push(userObject);
            Transaction.wrap(function () {
                productRecord.custom.user = JSON.stringify(existsingUserObj);
            });
            flag = true;
        }
        if (flag === true) {
            res.json({
                status: true,
                registered: registered,
                productID: productID,
                msg: Resource.msgf('success.message', 'notifyMe', null, userEmail)
            });
        } else {
            res.json({
                status: false,
                registered: registered,
                productID: productID,
                msg: Resource.msg('error.message', 'notifyMe', null)
            });
        }
    } else {
        res.json({
            status: false,
            registered: registered,
            productID: productID,
            msg: Resource.msg('invalid.product.message', 'notifyMe', null)
        });
    }

    next();
});

module.exports = server.exports();
