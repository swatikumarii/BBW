'use strict';

var URLUtils = require('dw/web/URLUtils');

/**
 * get Video Config
 * @param {string} url - url
 * @param {object} options - options
 * @returns {object} Config for VIDEOJS
 */
function getVideoConfig(url, options) {
    var config = {};
    var processedOptions = options;
    var processedUrl = url;

    if (processedOptions) {
        if (typeof processedOptions === 'string') {
            processedOptions = processedOptions.replace(/\(/gi, '{').replace(/\)/gi, '}');
            processedOptions = JSON.parse(processedOptions);
        }

        var objKeys = Object.keys(processedOptions);
        for (var i = 0; i < objKeys.length; i++) {
            var key = objKeys[i];
            config[key] = processedOptions[key];
        }
    }

    if (processedUrl) {
        if (processedUrl.indexOf('$staticlink$') > -1) {
            var endIndex = processedUrl.indexOf('$staticlink$');
            processedUrl = processedUrl.substring(0, endIndex - 1);
            processedUrl = URLUtils.absStatic(URLUtils.CONTEXT_LIBRARY, null, processedUrl).toString();
        }
        config.sources = [{
            src: processedUrl
        }];
    }

    return config;
}

module.exports = {
    getVideoConfig: getVideoConfig
};
