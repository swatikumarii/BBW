'use strict';

var ISML = require('dw/template/ISML');

/**
 * Should be executed right after body tag
 * Renders action name.
 * @param {object} pdict - pdict object
 */
function afterFooter(pdict) {
    var action = pdict.action;
    ISML.renderTemplate('popups/popupsGlobal', { action: action });
}

module.exports = {
    afterFooter: afterFooter
};
