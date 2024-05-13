'use strict';

var ContentMgr = require('dw/content/ContentMgr');

/**
 * get Email Content
 * @returns {object} - object with content to be putted in email
 * @param {string} footerType - Footer type
 * @param {string} headerType - Footer type
 */
function getEmailContent(footerType, headerType) {
    var headerContent = null;
    var footerContent = null;
    var content = null;

    if(headerType === 'newsletter-header') {
        content = ContentMgr.getContent('email-header-newsletter');
    } else {
        content = ContentMgr.getContent('email-header');
    }

    if (content && content.isOnline()) {
        headerContent = content.getCustom().body.markup;
    }

    if (footerType === 'normal-footer') {
        content = ContentMgr.getContent('email-footer');
    } else if (footerType === 'footer-suggestions') {
        content = ContentMgr.getContent('email-footer-with-suggestions');
    } else if (footerType === 'footer-only-topoffer') {
        content = ContentMgr.getContent('email-footer-only-topoffer');
    } else {
        content = false;
    }

    if (content && content.isOnline()) {
        footerContent = content.getCustom().body.markup;
    }

    return {
        headerContent: headerContent,
        footerContent: footerContent
    };
}

module.exports = {
    getEmailContent: getEmailContent
};
