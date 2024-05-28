'use strict';

if ($('body').find('.ds-smooth-scroll').length > 0) {
    var helpers = require('../../utils/scrollHelpers');
    helpers.dragScroll();
}
