'use strict';

var processInclude = require('base/util');
var addressAutocomplete = require('./checkout/addressAutocomplete');

$(document).ready(function () {
    google.maps.event.addDomListener(
        window,
        'load',
        addressAutocomplete.initializeAccount
    );
    processInclude(require('./addressBook/addressBook'));
});
