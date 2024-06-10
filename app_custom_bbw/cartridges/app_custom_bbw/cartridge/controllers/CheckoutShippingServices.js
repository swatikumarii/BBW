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

            result.address = {
                firstName: form.shippingAddress.addressFields.firstName.value,
                lastName: form.shippingAddress.addressFields.lastName.value,
                address1: form.shippingAddress.addressFields.address1.value,
                address2: form.shippingAddress.addressFields.address2.value,
                city: form.shippingAddress.addressFields.city.value,
                postalCode: form.shippingAddress.addressFields.postalCode.value,
                countryCode: form.shippingAddress.addressFields.country.value,
                phone: form.shippingAddress.addressFields.phone.value
            };
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

module.exports = server.exports();
