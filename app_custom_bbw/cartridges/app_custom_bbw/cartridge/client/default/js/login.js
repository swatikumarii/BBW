'use strict';

var processInclude = require('base/util');
var intlTelInput = require('intl-tel-input');
var utils = require('utils.js');

$(document).ready(function () {
    processInclude(require('./login/login'));
    var phone = document.querySelector('#registration-form-phone');
    intlTelInput(phone, {
        utilsScript: utils
    });
});

