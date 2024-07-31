'use strict';

var processInclude = require('base/util');
var intlTelInput = require('intl-tel-input');
var utils = require('utils.js');

$(document).ready(function () {
    processInclude(require('base/profile/profile'));
    // intltel on profile page
    var profilePhone = document.querySelector('#profilePhone');
    var profileIti = intlTelInput(profilePhone, {
        utilsScript: utils,
        showFlags: true,
        strictMode: true,
        showSelectedDialCode: true,
        initialCountry: $('.profileDialCodeCountry').val(),
        countryOrder: ['au'],
        formatAsYouType: false
    });
    $('#profilePhone').on('countrychange', function() {
        var countryData = profileIti.getSelectedCountryData();
        $('.profileDialCode').val(countryData.dialCode);
        $('.profileDialCodeCountry').val(countryData.iso2);
    });
});
