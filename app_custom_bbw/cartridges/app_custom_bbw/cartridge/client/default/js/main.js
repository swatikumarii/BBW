'use strict';

window.jQuery = require('jquery');
window.$ = require('jquery');
window.MEDIA_BREAKPOINTS = require('./config/config.json').breakpoints;
var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('base/components/menu'));
    processInclude(require('base/components/cookie'));
    processInclude(require('base/components/consentTracking'));
    processInclude(require('./components/header'));
    processInclude(require('./components/menu'));
    processInclude(require('./components/footer'));
    processInclude(require('./components/miniCart'));
    processInclude(require('base/components/collapsibleItem'));
    processInclude(require('./components/search'));
    processInclude(require('./components/clientSideValidation'));
    processInclude(require('base/components/countrySelector'));
    processInclude(require('base/components/toolTip'));
    // Session Out Popup js
    processInclude(require('./components/autoLogout'));
    processInclude(require('./components/header'));
    processInclude(require('./wishlist'));
    processInclude(require('notify/components/notify'));
    processInclude(require('./components/video'));
    processInclude(require('./utils/lazyLoad'));
});

require('./thirdParty/bootstrap');
require('./components/spinner');
require('./thirdParty/jqueryTicker');
