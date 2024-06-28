'use strict';

var logger = require('dw/system/Logger').getLogger('ServiceCapillary', 'Capillary');
var StringUtils = require('dw/util/StringUtils');

/**
 * Capillary API Call
 * @param {string} endPoint - API endPoint
 * @param {string} requestJSON request in json object
 * @param {string} method request method
 * @returns {dw.svc.result} result
 */
function callCapillaryAPI(endPoint, requestJSON, method) {
    var serviceResonse;
    try {
        var capillaryServiceInit = require('*/cartridge/scripts/service/init/capillaryService');
        var service = capillaryServiceInit.capillaryService;
        var serviceCredentials = service.getConfiguration().getCredential();
        var url = serviceCredentials.getURL() + endPoint;
        var auth = StringUtils.encodeBase64(serviceCredentials.user + ':' + serviceCredentials.password);
        service.setURL(url);
        service.setRequestMethod(method);
        service.addHeader('Authorization', 'Basic ' + auth);
        serviceResonse = service.call(requestJSON);
    } catch (error) {
        logger.info('Capillary API Call failed for endpoint {0} error is {1}', endPoint, error);
    }
    return serviceResonse;
}

/**
 * Store to capillary erros in profile and order object
 * @param {any} systemObject profile/order
 * @param capillaryErrors
 */
function storeErrorResponse(systemObject, capillaryErrors) {
    var sysObject = systemObject;
    var Transaction = require('dw/system/Transaction');
    Transaction.wrap(function () {
        sysObject.custom.capillaryResponse = capillaryErrors;
    });
}
module.exports = {
    createCustomer: function (registrationForm, newCustomerprofile) {
        var gender;
        switch (registrationForm.gender) {
            case 1:
                gender = 'Male';
                break;
            case 2:
                gender = 'Female';
                break;
            default:
                gender = 'Other';
                break;
        };
        var phoneNumber = registrationForm.phone.replace('+', '');
        phoneNumber = phoneNumber.replace(' ', '');
        var requestObj = {
            profiles: [{
                firstName: registrationForm.firstName,
                lastName: registrationForm.lastName,
                identifiers: [
                    {
                        type: 'mobile',
                        value: phoneNumber
                    },
                    {
                        type: 'email',
                        value: registrationForm.email
                    }
                ],
                source: 'INSTORE'
            }],
            extendedFields: {
                gender: gender
            }
        };
        if (registrationForm.birthday) {
            var date = new Date(registrationForm.birthday);
            var dob = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
            requestObj.extendedFields.dob = dob;
        }
        var createStatus = callCapillaryAPI('v2/customers', JSON.stringify(requestObj), 'POST');
        if (createStatus && createStatus.ok && 'object' in createStatus && createStatus.object) {
            var createObject = JSON.parse(createStatus.object);
            if ('errors' in createObject && createObject.errors && createObject.errors.length > 0) {
                storeErrorResponse(newCustomerprofile, JSON.stringify(createObject.errors));
                if (createObject.errors[0].code === 8006) {
                    var endPoint = 'v2/customers/lookup?source=INSTORE&identifierName=email&identifierValue=' + registrationForm.email;
                    var customerStatus = callCapillaryAPI(endPoint, '', 'GET');
                    if (customerStatus && customerStatus.ok && 'object' in customerStatus && customerStatus.object) {
                        var customerObj = JSON.parse(customerStatus.object);
                        if ('errors' in customerObj && customerObj.errors) {
                            logger.error('capillary create customer: ' + JSON.stringify(customerObj.errors));
                            return '';
                        }
                        if ('entity' in customerObj) {
                            return customerObj.entity;
                        }
                        return '';
                    }
                }
                return '';
            }
            return createObject.createdId;
        }
        return '';
    },
    createOrder: function (order, orderObject) {
        // prepare shipping address
        var shippingAddress = order.shipping[0].shippingAddress;
        var shippingCountry = shippingAddress.countryCode.value === 'AU' ? 'Australia' : shippingAddress.countryCode.value;
        var fullShippingAddress = shippingAddress.firstName + ' ' + shippingAddress.lastName + ' ' + shippingAddress.address1;
        fullShippingAddress = shippingAddress.address2 ? fullShippingAddress + ' ' + shippingAddress.address2 : fullShippingAddress;
        fullShippingAddress = fullShippingAddress + ' ' + shippingAddress.city + ' ' + shippingAddress.stateCode + ' ' + shippingAddress.postalCode + ' ' + shippingCountry;

        // prepare billing address
        var billingAddress = order.billing.billingAddress.address;
        var billingCountry = billingAddress.countryCode.value === 'AU' ? 'Australia' : billingAddress.countryCode.value;
        var fullBillingAddress = billingAddress.firstName + ' ' + billingAddress.lastName + ' ' + billingAddress.address1;
        fullBillingAddress = billingAddress.address2 ? fullBillingAddress + ' ' + billingAddress.address2 : fullBillingAddress;
        fullBillingAddress = fullBillingAddress + ' ' + billingAddress.city + ' ' + billingAddress.stateCode + ' ' + billingAddress.postalCode + ' ' + billingCountry;

        // prepare order items
        var orderItems = [];
        order.items.items.forEach(function (lineItem) {
            var itemPrice = 'priceValue' in lineItem.priceTotal && lineItem.priceTotal.priceValue <= 0 ? 0 : lineItem.priceTotal.price;
            itemPrice = parseFloat(itemPrice.toString().replace(order.currencyCode, ''));
            orderItems.push({
                itemCode: lineItem.id,
                amount: itemPrice,
                rate: lineItem.basePrice.value,
                qty: lineItem.quantity
            });
        });

        var orderTotal = parseFloat((order.totals.grandTotal).replace(order.currencyCode, '')).toFixed(2);
        var discount = order.totals.totalDiscount.value;
        var billAmount = orderTotal - discount;
        var requestObj = {
            type: 'REGULAR',
            billNumber: order.orderNumber,
            discount: Math.abs(discount),
            billAmount: parseFloat(billAmount).toFixed(2),
            // note: 'This is test',
            grossAmount: orderTotal,
            customFields: {
                ship_to_address: fullShippingAddress,
                bill_to_address: fullBillingAddress,
                paymentmode: order.billing.payment.selectedPaymentInstruments[0].paymentMethod,
                is_sf_order: true
            },
            lineItemsV2: orderItems
        };
        var customerEmail = order.orderEmail;
        var endPoint = 'v2/transactions?source=instore&identifierName=email&identifierValue='+customerEmail+'&rawSideEffects=true';
        var createStatus = callCapillaryAPI(endPoint, JSON.stringify(requestObj), 'POST');
        if (createStatus && createStatus !== null && createStatus.ok && 'object' in createStatus && createStatus.object) {
            var createObject = JSON.parse(createStatus.object);
            if ('errors' in createObject && createObject.errors && createObject.errors.length > 0) {
                logger.error('capillary create order: ' + JSON.stringify(createObject.errors));
                storeErrorResponse(orderObject, JSON.stringify(createObject.errors));
                return '';
            }
            return createObject.createdId;
        }
        return '';
    },
    updateCustomer: function (profileForm, profile) {
        var gender;
        switch (profileForm.gender) {
            case 1:
                gender = 'Male';
                break;
            case 2:
                gender = 'Female';
                break;
            default:
                gender = 'Other';
                break;
        };
        var requestObj = {
            profiles: [{
                firstName: profileForm.firstName,
                lastName: profileForm.lastName,
                source: 'INSTORE'
            }],
            extendedFields: {
                gender: gender
            }
        };
        if (profileForm.birthday) {
            var date = new Date(profileForm.birthday);
            var dob = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
            requestObj.extendedFields.dob = dob;
        }
        var capillaryCustomerID = '';
        if ('capillaryCustomerID' in profile.custom && profile.custom.capillaryCustomerID) {
            capillaryCustomerID = profile.custom.capillaryCustomerID;
        } else {
            var getCustomerEndPoint = 'v2/customers/lookup?source=INSTORE&identifierName=email&identifierValue=' + profile.email;
            var customerStatus = callCapillaryAPI(getCustomerEndPoint, '', 'GET');
            if (customerStatus && customerStatus.ok && 'object' in customerStatus && customerStatus.object) {
                var customerObj = JSON.parse(customerStatus.object);
                if ('errors' in customerObj && customerObj.errors) {
                    logger.error('capillary update profile: get customer: ' + JSON.stringify(customerObj.errors));
                    storeErrorResponse(profile, JSON.stringify(customerObj.errors));
                    return '';
                }
                if ('entity' in customerObj) {
                    capillaryCustomerID = customerObj.entity;
                }
            }
        }
        if (capillaryCustomerID) {
            var endPoint = 'v2/customers/' + capillaryCustomerID + '?source=INSTORE';
            var createStatus = callCapillaryAPI(endPoint, JSON.stringify(requestObj), 'PUT');
            if (createStatus.ok && 'object' in createStatus && createStatus.object) {
                var createObject = JSON.parse(createStatus.object);
                if ('errors' in createObject && createObject.errors && createObject.errors.length > 0) {
                    logger.error('capillary update customer: ' + JSON.stringify(createObject.errors));
                    storeErrorResponse(profile, JSON.stringify(createObject.errors));
                    return '';
                }
                return capillaryCustomerID;
            }
        }
        return '';
    },
    getOrders: function (customerEmail) {
        var endPoint = 'v1.1/customer/transactions?format=json&email=' + customerEmail + '&mlp=true';
        var createStatus = callCapillaryAPI(endPoint, '', 'GET');
        if (createStatus.ok && 'object' in createStatus && createStatus.object) {
            var createObject = JSON.parse(createStatus.object);
            if ('errors' in createObject && createObject.errors && createObject.errors.length > 0) {
                logger.error('capillary get order: ' + JSON.stringify(createObject.errors));
                return '';
            }
            var customerData = createObject.response.customer;
            if ('transactions' in customerData) {
                return createObject.response.customer.transactions.transaction;
            }
        }
        return [];
    }
};
