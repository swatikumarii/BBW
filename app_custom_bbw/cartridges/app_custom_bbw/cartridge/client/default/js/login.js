'use strict';

var processInclude = require('base/util');
var intlTelInput = require('intl-tel-input');
var utils = require('utils.js');

$(document).ready(function () {
    processInclude(require('./login/login'));
    var phone = document.querySelector('#registration-form-phone');
    intlTelInput(phone, {
        utilsScript: utils,
        showFlags: true,
        showSelectedDialCode: true
    });
});
// Add this script to your page
$(document).ready(function() {
    var passwordInput = $('#login-form-password');
    var showButton = $('.login-modal-hide');

    showButton.on('click', function() {
        var type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
        passwordInput.attr('type', type);
        $(this).find('.show').text(type === 'password' ? 'Show' : 'Hide');
    });
});
