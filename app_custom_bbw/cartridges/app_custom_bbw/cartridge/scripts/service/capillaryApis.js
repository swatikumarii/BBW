'use strict';

var logger = require('dw/system/Logger').getLogger('Service', 'Capillary');
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

module.exports = {
    createCustomer: function (registrationForm) {
        var date = new Date(registrationForm.birthday);
        var dob = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
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
                source: 'INSTORE',
                fields: {
                    dateofbirth: dob
                }
            }],
            extendedFields: {
                gender: gender,
                dob: dob
            }
        };
        var createStatus = callCapillaryAPI('customers', JSON.stringify(requestObj), 'POST');
        if (createStatus.ok && 'object' in createStatus && createStatus.object) {
            var createObject = JSON.parse(createStatus.object);
            if ('errors' in createObject && createObject.errors && createObject.errors.length > 0 && createObject.errors[0].code === 8006) {
                var endPoint = 'customers/lookup?source=INSTORE&identifierName=mobile&identifierValue=' + phoneNumber;
                var customerStatus = callCapillaryAPI(endPoint, '', 'GET');
                if (customerStatus && customerStatus.ok && 'object' in customerStatus && customerStatus.object) {
                    var customerObj = JSON.parse(customerStatus.object);
                    if ('errors' in customerObj && customerObj.errors) {
                        return '';
                    }
                    if ('entity' in customerObj) {
                        return customerObj.entity;
                    }
                    return '';
                }
            } else {
                return createObject.createdId;
            }
        }
        return '';
    }
};
