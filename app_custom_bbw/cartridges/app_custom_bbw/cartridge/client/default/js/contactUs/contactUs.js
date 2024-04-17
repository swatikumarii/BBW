'use strict';

var baseContactUs = require('base/contactUs/contactUs');


window.submitContactUs = function (token) {
    return new Promise(function (resolve, reject) {
        if (!token) {
            reject();
        }
        if (token !== '') {
            $('.g-recaptcha').closest('form.contact-us').submit();
            resolve();
        }
        grecaptcha.reset();
    });
};

var exportDetails = $.extend({}, baseContactUs);

module.exports = exportDetails;
