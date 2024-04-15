'use strict';

var helpers = {
    $win: $(window),
    $html: $('html'),
    $body: $('body'),

    isPlatformIOS: function () {
        return !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
    },

    isPlatformMacOS: function () {
        return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    },

    isPlatformApple: function () {
        return this.isPlatformIOS() || this.isPlatformMacOS();
    },

    isAndroidOS: function () {
        return navigator.userAgent.toLowerCase().indexOf('android') > -1;
    },

    getLanguageCode: function () {
        return $('html').attr('lang');
    },

    appendParamToURL: function (url, name, value) {
        // quit if the param already exists
        if (url.indexOf(name + '=') !== -1) {
            return url;
        }
        var separator = url.indexOf('?') !== -1 ? '&' : '?';
        var paramValue = decodeURIComponent(value);
        return url + separator + name + '=' + encodeURIComponent(paramValue);
    },

    /**
     * Sets page state to the cookie
     * @param {object} pageType - pageType
     * @param {string} elementStateName - elementStateName
     * @param {string} stateValue - stateValue
     */
    setPageState: function (pageType, elementStateName, stateValue) {
        var pageState = helpers.getCookie('pageState');
        if (pageState) {
            pageState = JSON.parse(pageState);
        } else {
            pageState = {};
        }
        if (!pageState[pageType]) {
            pageState[pageType] = {};
        }
        pageState[pageType][elementStateName] = stateValue;
        helpers.setCookie('pageState', JSON.stringify(pageState));
    },

    /**
     * Get page state to the cookie
     * @param {object} pageType - pageType
     * @param {string} elementStateName - elementStateName
     * @returns {string} stateValue
     */
    getPageState: function (pageType, elementStateName) {
        var stateValue = null;
        var pageState = helpers.getCookie('pageState');
        if (pageState) {
            try {
                pageState = JSON.parse(pageState);
            } catch (error) {
                pageState = false;
            }
            if (typeof pageState === 'object' && pageState[pageType] && pageState[pageType][elementStateName]) {
                stateValue = pageState[pageType][elementStateName];
            }
        }
        return stateValue;
    },

    /**
     * Sets cookies
     * @param {object} cookies - cookies
     * @param {string} exdays - expire days
     */
    setCookies: function (cookies, exdays) {
        var exseconds = exdays * 24 * 60 * 60;

        cookies.forEach(function (cookie) {
            helpers.setCookie(cookie.name, cookie.value, {
                expires: exseconds
            });
        });
    },

    /**
     *  Set cookie by name
     *  @param {string} name of cookie
     *  @param {string} value of cookie
     *  @param {object} options options
     */
    setCookie: function (name, value, options) {
        // Create a local copy of options to avoid direct modification
        var localOptions = Object.assign({}, options || {});
        localOptions.path = localOptions.path || '/';

        // Handle expires option
        if (typeof localOptions.expires === 'number' && localOptions.expires) {
            if (localOptions.expires !== -1) {
                var d = new Date();
                d.setTime(d.getTime() + localOptions.expires * 1000);
                localOptions.expires = d;
            }
        }
        if (localOptions.expires && localOptions.expires.toUTCString) {
            localOptions.expires = localOptions.expires.toUTCString();
        }

        // Encode the value
        var encodedValue = encodeURIComponent(value);

        // Start constructing the cookie string
        var updatedCookie = name + '=' + encodedValue + ';secure';

        // Append additional options to the cookie string
        Object.keys(localOptions).forEach(function (propName) {
            if (Object.prototype.hasOwnProperty.call(localOptions, propName)) {
                updatedCookie += '; ' + propName;
                var propValue = localOptions[propName];
                if (propValue !== true) {
                    updatedCookie += '=' + propValue;
                }
            }
        });


        // Set the cookie
        document.cookie = updatedCookie;
    },

    /**
     * get cookie by name
     * @param {string} name of cookie
     * @returns {string|undefined} cookie value or undefined
     */
    getCookie: function (name) {
        var matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)" /* eslint-disable-line */
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined; // eslint-disable-line
    },

    /**
     * remove cookie by name
     * @param {string} name of cookie
     */
    removeCookie: function (name) {
        // Must not alter options, thus extending a fresh object...
        helpers.setCookie(name, '', {
            expires: -1,
            path: '/'
        });
    }
};

module.exports = helpers;
