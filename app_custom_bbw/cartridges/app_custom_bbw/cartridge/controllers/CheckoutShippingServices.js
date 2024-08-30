'use strict';

/**
 * @namespace CheckoutShippingServices
 */

var server = require('server');

server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * Handle Ajax shipping form submit
 */
/**
 * CheckoutShippingServices-SubmitShipping : The CheckoutShippingServices-SubmitShipping endpoint submits the shopper's shipping addresse(s) and shipping method(s) and saves them to the basket
 * @name CheckoutShippingServices-SubmitShipping
 * @memberof CheckoutShippingServices
 * @returns {object} - json
 */
server.replace(
    'SubmitShipping',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var URLUtils = require('dw/web/URLUtils');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var ShippingMgr = require('dw/order/ShippingMgr');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
        var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');

        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();
        }

        var validatedProducts = validationHelpers.validateProducts(currentBasket);
        if (validatedProducts.error) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();
        }

        var form = server.forms.getForm('shipping');
        var result = {};

        // verify shipping form data
        var shippingFormErrors = COHelpers.validateShippingForm(form.shippingAddress.addressFields);

        var applicableShippingMethods = ShippingMgr.getShipmentShippingModel(
            currentBasket.getDefaultShipment()
        ).getApplicableShippingMethods();

        if (Object.keys(shippingFormErrors).length > 0 || !applicableShippingMethods.length) {
            if (!applicableShippingMethods.length) {
                res.json({
                    error: true,
                    cartError: true,
                    fieldErrors: [],
                    serverErrors: [],
                    redirectUrl: URLUtils.url('Cart-Show','error','dangerous-goods').toString()
                });
            } else {
                req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'invalid');
                res.json({
                    form: form,
                    fieldErrors: [shippingFormErrors],
                    serverErrors: [],
                    error: true
                });
            }
        } else {
            req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'valid');

            // remove spaces between phone number digits
            var phoneNumber = form.shippingAddress.addressFields.phone.value.replace(/[+\-\s()]/g, '');

            result.address = {
                firstName: form.shippingAddress.addressFields.firstName.value,
                lastName: form.shippingAddress.addressFields.lastName.value,
                address1: form.shippingAddress.addressFields.address1.value,
                address2: form.shippingAddress.addressFields.address2.value,
                city: form.shippingAddress.addressFields.city.value,
                postalCode: form.shippingAddress.addressFields.postalCode.value,
                countryCode: form.shippingAddress.addressFields.country.value,
                phone: phoneNumber,
                dialCode: form.shippingAddress.addressFields.dialCode.value,
                dialCodeCountry: form.shippingAddress.addressFields.dialCodeCountry.value
            };
            if ('district' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.district.value) {
                result.address.district = form.shippingAddress.addressFields.district.value;
            }
            if ('subdistrict' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.subdistrict.value) {
                result.address.subDistrict = form.shippingAddress.addressFields.subdistrict.value;
            }
            if (Object.prototype.hasOwnProperty
                .call(form.shippingAddress.addressFields, 'states')) {
                result.address.stateCode = form.shippingAddress.addressFields.states.stateCode.value;
            }

            result.shippingBillingSame = form.shippingAddress.shippingAddressUseAsBillingAddress.value;
            result.saveAddress = form.shippingAddress.saveAddress.value;

            result.shippingMethod = form.shippingAddress.shippingMethodID.value
                ? form.shippingAddress.shippingMethodID.value.toString()
                : null;

            res.setViewData(result);

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var AccountModel = require('*/cartridge/models/account');
                var OrderModel = require('*/cartridge/models/order');
                var Locale = require('dw/util/Locale');

                var shippingData = res.getViewData();

                COHelpers.copyShippingAddressToShipment(
                    shippingData,
                    currentBasket.defaultShipment
                );

                if (req.currentCustomer.addressBook && shippingData.saveAddress) {
                    // save all used shipping addresses to address book of the logged in customer
                    var allAddresses = addressHelpers.gatherShippingAddresses(currentBasket);
                    allAddresses.forEach(function (address) {
                        if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
                            addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address), true);
                        }
                    });
                }

                if (
                    req.currentCustomer.addressBook &&
                    req.currentCustomer.addressBook.preferredAddress &&
                    !shippingData.shippingBillingSame
                ) {
                    // Copy over preferredAddress (use addressUUID for matching)
                    COHelpers.copyBillingAddressToBasket(
                        req.currentCustomer.addressBook.preferredAddress,
                        currentBasket
                    );
                } else if (shippingData.shippingBillingSame) {
                    // Copy over first shipping address (use shipmentUUID for matching)
                    COHelpers.copyBillingAddressToBasket(
                        currentBasket.defaultShipment.shippingAddress,
                        currentBasket
                    );
                }

                var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
                if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                    req.session.privacyCache.set('usingMultiShipping', false);
                    usingMultiShipping = false;
                }

                COHelpers.recalculateBasket(currentBasket);

                var currentLocale = Locale.getLocale(req.locale.id);
                var basketModel = new OrderModel(
                    currentBasket,
                    {
                        usingMultiShipping: usingMultiShipping,
                        shippable: true,
                        countryCode: currentLocale.country,
                        containerView: 'basket'
                    }
                );

                res.json({
                    customer: new AccountModel(req.currentCustomer),
                    order: basketModel,
                    form: server.forms.getForm('shipping')
                });
            });
        }

        return next();
    }
);

/**
 * CheckoutShippingServices-UpdateShippingMethodsList : The CheckoutShippingServices-UpdateShippingMethodsList endpoint gets hit once a shopper has entered certain address infromation and gets the applicable shipping methods based on the shopper's supplied shipping address infromation
 * @name CheckoutShippingServices-UpdateShippingMethodsList
 * @memberof CheckoutShippingServices
 * @returns {object} - json
 */
server.replace('UpdateShippingMethodsList', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var URLUtils = require('dw/web/URLUtils');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var Locale = require('dw/util/Locale');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
    var shipment;
    if (shipmentUUID) {
        shipment = ShippingHelper.getShipmentByUUID(currentBasket, shipmentUUID);
    } else {
        shipment = currentBasket.defaultShipment;
    }

    var address = ShippingHelper.getAddressFromRequest(req);

    var shippingMethodID;

    if (shipment.shippingMethod) {
        shippingMethodID = shipment.shippingMethod.ID;
    }

    Transaction.wrap(function () {
        var shippingAddress = shipment.shippingAddress;

        if (!shippingAddress) {
            shippingAddress = shipment.createShippingAddress();
        }

        Object.keys(address).forEach(function (key) {
            var value = false;
            // Indonesia fields logic for district and subDistrict
            if (['district', 'subDistrict'].includes(key)) {
                value = address[key];
                if (value) {
                    shippingAddress.custom[key] = value;
                } else {
                    shippingAddress.custom[key] = null;
                }
            } else {
                value = address[key];
                if (value) {
                    shippingAddress[key] = value;
                } else {
                    shippingAddress[key] = null;
                }
            }
        });

        ShippingHelper.selectShippingMethod(shipment, shippingMethodID);

        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    var currentLocale = Locale.getLocale(req.locale.id);

    var basketModel = new OrderModel(
        currentBasket,
        { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
    );

    res.json({
        customer: new AccountModel(req.currentCustomer),
        order: basketModel,
        shippingForm: server.forms.getForm('shipping')
    });

    return next();
});

module.exports = server.exports();
