'use strict';

/**
 * @namespace Order
 */

var server = require('server');
server.extend(module.superModule);

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var encryptionHelper = require('*/cartridge/scripts/helpers/encryptionHelpers');
var Order = require('dw/order/Order');
var seo = require('*/cartridge/scripts/middleware/seo');
var Transaction = require('dw/system/Transaction');
var capillaryAPI = require('*/cartridge/scripts/service/capillaryApis');

/**
 * Order-Details : The Order-Details append to add notify-me functionality
 * @name Order-Details
 */
server.append(
    'Details',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var viewData = res.getViewData();

        var userEmail = req.currentCustomer.raw.registered
            ? req.currentCustomer.profile.email
            : false;

        if (viewData.order.shipping.length > 0){
            var products = viewData.order.shipping[0].productLineItems.items;
            for (var index = 0; index < products.length; index++) {
                if (products[index].isEgiftCard) {
                    viewData.isEgiftCard = products[index].isEgiftCard;
                    break;
                }

                var productRecord = CustomObjectMgr.getCustomObject(
                    'notifyBackInStock',
                    products[index].id
                );
                products[index].productPresentInNotifyList = false;
                if (userEmail && productRecord !== null && productRecord.custom.user.indexOf(userEmail) !== -1) {
                    products[index].productPresentInNotifyList = true;
                }
            }
        }
        viewData.isOrderBaseRemoveGiftCard = true;
        res.setViewData(viewData);
        next();
    },seo.addCurrentPageMetaData);



/**
 * Order-History : The Order-History append to update breadcrumbs
 * @name Order-History
 */
server.append(
    'History',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var viewData = res.getViewData();

        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg(
                    'page.title.myaccount',
                    'account',
                    null
                ),
                url: URLUtils.url('Account-Show').toString()
            },
            {
                htmlValue: Resource.msg('label.orderhistory', 'account', null),
                url: URLUtils.url('Address-List').toString()
            }
        ];
        viewData.breadcrumbs = breadcrumbs;

        res.setViewData(viewData);

        next();
    },
    seo.addCurrentPageMetaData);

/**
 * Order-InvoiceDownload : The Order-InvoiceDownload endpoint get order details to download invoice
 * @name Order-AddProductFromOrder
 */
server.get('InvoiceDownload', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
    var TaxMgr = require('dw/order/TaxMgr');
    var orderID = encryptionHelper.decryptPin(
        decodeURIComponent(req.querystring.token)
    );
    var order = OrderMgr.getOrder(orderID);
    var taxClassId = TaxMgr.getDefaultTaxClassID();
    var taxJurisdictionId = TaxMgr.getDefaultTaxJurisdictionID();
    var getTaxRate = TaxMgr.getTaxRate(taxClassId, taxJurisdictionId);
    var taxRate = getTaxRate * 100;

    if (order) {
        var isEgiftCard = false;
        var orderModel = orderHelpers.getOrderDetailsByID(
            orderID,
            req.locale.id
        );
        if (
            orderModel &&
            orderModel.shipping &&
            orderModel.shipping.length > 0
        ) {
            if (
                orderModel.shipping[0].productLineItems &&
                orderModel.shipping[0].productLineItems.items
            ) {
                var products = orderModel.shipping[0].productLineItems.items;
                for (var index = 0; index < products.length; index++) {
                    if (products[index].isEgiftCard) {
                        isEgiftCard = products[index].isEgiftCard;
                        break;
                    }
                }
            }
        }

        var eInvoiceJson = {};
        if('eInvoiceQrCode' in order.custom)
        {
            eInvoiceJson = JSON.parse(order.custom.eInvoiceQrCode) || {};
        }

        res.render('order/invoiceDownload', {
            order: orderModel,
            taxRate: taxRate,
            isEgiftCard: isEgiftCard,
            eInvoiceQrCodeLink: eInvoiceJson.url || '',
            eInvoiceQrCode: eInvoiceJson.qrcode || false
        });
    } else {
        res.redirect(URLUtils.url('Order-History'));
    }
    next();
});


/**
 * Order-Failed : This endpoint is invoked when the shopper's Order is Placed and Failed
 * @name Order-Failed
 * @function
 * @memberof Order
 * @param {middleware} middleware - consentTracking.consent
 * @param {middleware} middleware - server.middleware.https
 */
server.get(
    'Failed',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');

        var order;
        var orderID = session.privacy.orderNo;

        if (!orderID) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        order = OrderMgr.getOrder(orderID);

        if (!order || order.customer.ID !== req.currentCustomer.raw.ID
        ) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }
        var lastOrderID = Object.prototype.hasOwnProperty.call(req.session.raw.custom, 'orderID') ? req.session.raw.custom.orderID : null;
        if (lastOrderID === req.querystring.ID) {
            res.redirect(URLUtils.url('Home-Show'));
            return next();
        }

        var config = {
            numberOfLineItems: '*'
        };

        var currentLocale = Locale.getLocale(req.locale.id);

        var orderModel = new OrderModel(
            order,
            { config: config, countryCode: currentLocale.country, containerView: 'order' }
        );
        var passwordForm;

        var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);

        if (!req.currentCustomer.profile) {
            passwordForm = server.forms.getForm('newPasswords');
            passwordForm.clear();
            res.render('checkout/failedOrder', {
                order: orderModel,
                returningCustomer: false,
                passwordForm: passwordForm,
                reportingURLs: reportingURLs,
                orderUUID: order.getUUID()
            });
        } else {
            res.render('checkout/failedOrder', {
                order: orderModel,
                returningCustomer: true,
                reportingURLs: reportingURLs,
                orderUUID: order.getUUID()
            });
        }
        return next();
    },
    seo.addCurrentPageMetaData
);

/**
 * Order-Pending : This endpoint is invoked when the shopper's Order is Placed and in pending state
 * @name Order-Pending
 * @function
 * @memberof Order
 * @param {middleware} middleware - consentTracking.consent
 * @param {middleware} middleware - server.middleware.https
 */
server.get(
    'Pending',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');

        var order;
        var orderID = session.privacy.orderNo;

        if (!orderID) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        order = OrderMgr.getOrder(orderID);

        if (!order || order.customer.ID !== req.currentCustomer.raw.ID
        ) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }
        var lastOrderID = Object.prototype.hasOwnProperty.call(req.session.raw.custom, 'orderID') ? req.session.raw.custom.orderID : null;
        if (lastOrderID === req.querystring.ID) {
            res.redirect(URLUtils.url('Home-Show'));
            return next();
        }

        var config = {
            numberOfLineItems: '*'
        };

        var currentLocale = Locale.getLocale(req.locale.id);

        var orderModel = new OrderModel(
            order,
            { config: config, countryCode: currentLocale.country, containerView: 'order' }
        );
        var passwordForm;

        var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);

        if (!req.currentCustomer.profile) {
            passwordForm = server.forms.getForm('newPasswords');
            passwordForm.clear();
            res.render('checkout/pendingOrder', {
                order: orderModel,
                returningCustomer: false,
                passwordForm: passwordForm,
                reportingURLs: reportingURLs,
                orderUUID: order.getUUID()
            });
        } else {
            res.render('checkout/pendingOrder', {
                order: orderModel,
                returningCustomer: true,
                reportingURLs: reportingURLs,
                orderUUID: order.getUUID()
            });
        }
        return next();
    },
    seo.addCurrentPageMetaData
);

/**
 * This Route is to render order tracking form page
 */
server.get(
    'Status',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        var viewData = res.getViewData();
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('label.order.tracking', 'order', null),
                url: URLUtils.url('Order-Status').toString()
            }
        ];
        viewData.breadcrumbs = breadcrumbs;
        res.render('account/orderTracking');
        return next();
    },
    seo.addCurrentPageMetaData
);

/**
 * This Route is to render order tracking form page
 */
server.get(
    'Tracking',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var OrderMgr = require('dw/order/OrderMgr');
        var orderId = encryptionHelper.decryptPin(
            decodeURIComponent(req.querystring.token)
        );
        if (orderId) {
            var order = OrderMgr.getOrder(orderId);
            var breadcrumbs = [];
            if (req.currentCustomer.profile) {
                breadcrumbs = [
                    {
                        htmlValue: Resource.msg('global.home', 'common', null),
                        url: URLUtils.home().toString()
                    },
                    {
                        htmlValue: Resource.msg(
                            'page.title.myaccount',
                            'account',
                            null
                        ),
                        url: URLUtils.url('Account-Show').toString()
                    },
                    {
                        htmlValue: Resource.msg('label.orderhistory', 'account', null),
                        url: URLUtils.url('Order-History').toString()
                    }
                ];
            } else {
                breadcrumbs = [
                    {
                        htmlValue: Resource.msg('global.home', 'common', null),
                        url: URLUtils.home().toString()
                    },
                    {
                        htmlValue: Resource.msg(
                            'label.order.tracking',
                            'order',
                            null
                        ),
                        url: URLUtils.url('Order-Status').toString()
                    },
                    {
                        htmlValue: Resource.msg('order.title.receipt', 'order', null),
                        url: URLUtils.url('Order-Tracking').toString()
                    }
                ];
            }

            if (order) {
                var orderModel = orderHelpers.getOrderDetailsByID(
                    orderId,
                    req.locale.id
                );
                var exitLinkText = Resource.msg(
                    'link.orderdetails.orderhistory',
                    'account',
                    null
                );
                var exitLinkUrl = URLUtils.https(
                    'Order-History',
                    'orderFilter',
                    req.querystring.orderFilter
                );

                var isEgiftCard;
                if (orderModel.shipping.length > 0) {
                    var products = orderModel.shipping[0].productLineItems.items;
                    for (var index = 0; index < products.length; index++) {
                        if (products[index].isEgiftCard) {
                            isEgiftCard = products[index].isEgiftCard;
                            break;
                        }
                    }
                }
                var isOrderBaseRemoveGiftCard = true;
                res.render('account/orderDetails', {
                    order: orderModel,
                    exitLinkText: exitLinkText,
                    exitLinkUrl: exitLinkUrl,
                    isOrderBaseRemoveGiftCard: isOrderBaseRemoveGiftCard,
                    isEgiftCard: isEgiftCard,
                    breadcrumbs: breadcrumbs
                });
            } else {
                res.redirect(URLUtils.url('Account-Show'));
            }
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
        return next();
    },
    seo.addCurrentPageMetaData);

/**
 * Order-Check : This endpoint is used to track a placed Order
 * @name Order-Check
 */
server.post(
    'Check',
    consentTracking.consent,
    server.middleware.https,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
        var error = orderHelpers.validateTrackingData(
            req.form.orderNumber, req.form.orderEmail, req.form.billingZipCode
        );
        if (error && error.length === 0) {
            var order = OrderMgr.getOrder(req.form.orderNumber);
            if (
                order &&
                order.customerEmail.toLowerCase() === req.form.orderEmail.toLowerCase().trim() &&
                order.billingAddress.postalCode === req.form.billingZipCode.trim()
            ) {
                res.json({
                    redirectUrl: URLUtils.url('Order-Tracking', 'token', encryptionHelper.encryptPin(req.form.orderNumber)).toString()
                });
            } else {
                res.json({
                    error: true,
                    message: Resource.msg(
                        'error.order.not.found',
                        'order',
                        null
                    )
                });
            }
        } else {
            res.json({
                error: true,
                fieldErrors: error
            });
        }
        next();
    }
);

/**
 * Order-Confirm : Append to extend the order confirm functionality
 * @name Order-Confirm
 */
server.append(
    'Confirm',
    function (req, res, next) {
        this.on('route:BeforeComplete', function () {
            // send email when order total 0
            var commonHelper = require('*/cartridge/scripts/helpers/commonHelpers');
            var dynamicBadgeHelpers = require('*/cartridge/scripts/helpers/dynamicBadgeHelpers');
            var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
            var viewData = res.getViewData();
            var OrderMgr = require('dw/order/OrderMgr');
            var order = OrderMgr.getOrder(viewData.order.orderNumber);

            // save address
            if (session.privacy.addressBook && session.privacy.saveAddress) {
                var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
                var address = addressHelpers.copyShippingAddress(order.billingAddress);
                // save all used billing addresses to address book of the logged in customer
                if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
                    addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address), true);
                }
                session.privacy.addressBook = null;
                session.privacy.saveAddress = null;
            }

            // save billingaddress dial code and dial code country
            if (session.privacy.billingDialCode && session.privacy.billingDialCodeCountry) {
                Transaction.wrap(function () {
                    order.billingAddress.custom.dialCode = session.privacy.billingDialCode;
                    order.billingAddress.custom.dialCodeCountry = session.privacy.billingDialCodeCountry;
                });
                session.privacy.billingDialCode = null;
                session.privacy.billingDialCodeCountry = null;
            }

            var isGiftProductAvailable = qwikcilverHelpers.validateGiftProduct(order);
            viewData.isGiftProductAvailable = isGiftProductAvailable;
            if (order && order.totalGrossPrice.value === 0) {
                commonHelper.zeroOrderEmail(viewData.order);
            }

            // redirection url
            viewData.orderStatusVal = Order;
            // if (order && order.paymentStatus.value === viewData.orderStatusVal.PAYMENT_STATUS_NOTPAID
            //     && order.paymentTransaction && order.paymentTransaction !== null && 'custom' in order.paymentTransaction && order.paymentTransaction.custom
            //     && 'Adyen_paymentMethod' in order.paymentTransaction.custom && 'authCode' in order.paymentTransaction.custom
            //     && order.paymentTransaction.custom.authCode === 'Authorised') {
            //     Transaction.wrap(function () {
            //         order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
            //     });
            //     COHelpers.sendConfirmationEmail(order, req.locale.id);
            // }
            res.setViewData(viewData);
            if (order.status.value === Order.ORDER_STATUS_FAILED || order.status.value === Order.ORDER_STATUS_CANCELLED) {
                res.redirect(URLUtils.url('Order-Failed'));
            }
            if (order.status.value === Order.ORDER_STATUS_CREATED) {
                res.redirect(URLUtils.url('Order-Pending'));
            }
            var crmOrderID = '';
            if (
                req.currentCustomer &&
                req.currentCustomer.raw &&
                req.currentCustomer.raw.profile
            ) {
                dynamicBadgeHelpers.updateCartDetailInProfile(
                    req.currentCustomer.raw.profile
                );

                // Capillary: create order
                crmOrderID = capillaryAPI.createOrder(viewData.order, order);
                Transaction.wrap(function () {
                    if (crmOrderID) {
                        order.custom.capillaryOrderID = crmOrderID;
                        order.custom.capillaryResponse = '';
                        order.custom.capillaryFailed = false;
                        order.custom.capillaryRequest = '';
                    } else {
                        order.custom.capillaryFailed = true;
                    }
                });
            } else {
                var billingAddress = viewData.order.billing.billingAddress.address;
                var expressCheckout = false;
                var paymentInstrument = order.paymentInstruments[0];
                if (paymentInstrument.paymentMethod === 'AdyenComponent' && !order.billingAddress.custom.dialCode) {
                    expressCheckout = true;
                } else if (paymentInstrument.paymentMethod === 'AFTERPAY') {
                    expressCheckout = paymentInstrument.paymentTransaction.custom.apExpressCheckout;
                }
                // remove 0 from starting of phone number
                var billingPhn = billingAddress.phone;
                if (billingPhn.startsWith('0')) {
                    billingPhn = billingPhn.substr(1);
                }
                var customerData = {
                    firstName : billingAddress.firstName,
                    lastName: billingAddress.lastName,
                    phone: billingPhn,
                    email: viewData.order.orderEmail,
                    dialCode: order.billingAddress.custom.dialCode,
                    expressCheckout: expressCheckout
                };
                var crmCustomerID = capillaryAPI.createCustomer(customerData, order);
                if (crmCustomerID) {
                    crmOrderID = capillaryAPI.createOrder(viewData.order);
                    Transaction.wrap(function () {
                        if (crmOrderID) {
                            order.custom.capillaryOrderID = crmOrderID;
                            order.custom.capillaryResponse = '';
                            order.custom.capillaryFailed = false;
                            order.custom.capillaryRequest = '';
                        } else {
                            order.custom.capillaryFailed = true;
                        }
                    });
                } else {
                    Transaction.wrap(function () {
                        order.custom.capillaryFailed = true;
                    });
                }
            }
        });
        return next();
    },
    seo.addCurrentPageMetaData);

server.get(
    'StoreOrders',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg(
                    'page.title.myaccount',
                    'account',
                    null
                ),
                url: URLUtils.url('Account-Show').toString()
            },
            {
                htmlValue: Resource.msg('label.orderhistory', 'account', null),
                url: URLUtils.url('Address-List').toString()
            }
        ];
        var customerEmail = req.currentCustomer.profile.email;
        var orders = capillaryAPI.getOrders(customerEmail);
        res.render('account/order/capillaryOrders', {
            orders: orders,
            accountlanding: false,
            breadcrumbs: breadcrumbs
        });
        next();
    },
    seo.addCurrentPageMetaData);

server.get(
    'StoreDetails',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
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
                htmlValue: Resource.msg('label.orderhistory', 'account', null),
                url: URLUtils.url('Order-History').toString()
            }
        ];
        var order = capillaryAPI.getOrderDetail(req.querystring.orderID);
        var exitLinkText = Resource.msg('link.orderdetails.orderhistory', 'account', null);
        res.render('account/capillaryOrderDetails', {
            order: order,
            exitLinkText: exitLinkText,
            breadcrumbs: breadcrumbs
        });
        next();
    },
    seo.addCurrentPageMetaData);

module.exports = server.exports();
