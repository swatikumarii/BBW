'use strict';

var base = module.superModule;

/**
 * returns address properties from a request
 * @param {object} req - the request object
 * @returns {object} - a JSON object with all values
 */
function getAddressFromRequest(req) {
    var addressObj = {
        firstName: req.form.firstName,
        lastName: req.form.lastName,
        address1: req.form.address1,
        address2: req.form.address2,
        city: req.form.city,
        stateCode: req.form.stateCode,
        postalCode: req.form.postalCode,
        countryCode: req.form.countryCode,
        phone: req.form.phone
    };
    if (req.form.district) {
        addressObj.district = req.form.district;
    }
    if (req.form.subDistrict) {
        addressObj.subDistrict = req.form.subDistrict;
    }
    return addressObj;
}

base.getAddressFromRequest = getAddressFromRequest;

module.exports = base;
