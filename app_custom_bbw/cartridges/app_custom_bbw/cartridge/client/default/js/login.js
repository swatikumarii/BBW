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
document.addEventListener('DOMContentLoaded', function() {
    var passwordInput = document.getElementById('login-form-password');
    var showButton = document.querySelector('.login-modal-hide');

    showButton.addEventListener('click', function() {
        var type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('.show').textContent = type === 'password' ? 'Show' : 'Hide';
    });
});
