'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./product/detail'));
    processInclude(require('./product/wishlist'));
});

/* Zoom Image */
$('.zoomImage-link').on('click', function () {
    $('.zoomImage-sec').css('display', 'block');
});
$('.zoomOut-link').on('click', function () {
    $('.zoomImage-sec').css('display', 'none');
});
