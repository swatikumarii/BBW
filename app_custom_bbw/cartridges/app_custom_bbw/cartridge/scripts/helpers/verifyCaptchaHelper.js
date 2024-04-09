'use strict';

/**
 * To verify google reCAPTCHA
 * @param {string} recaptchaResponse - reCAPTCHA token
 * @param {number} score - required page score
 * @returns {boolean} - return boolean value to indicate that captcha token is verifyed
 */
function verifyGoogleCaptcha(recaptchaResponse, score) {
    var valid = false;
    var secretKey = dw.system.Site.getCurrent().getCustomPreferenceValue(
        'googleRecaptchaSceretKey'
    );
    var HTTPClient = require('dw/net/HTTPClient');
    var postData = '';
    postData += 'secret=' + encodeURIComponent(secretKey);
    postData += '&response=' + encodeURIComponent(recaptchaResponse);

    var httpClient = new HTTPClient();
    httpClient.setTimeout(3000);
    httpClient.open('POST', 'https://www.google.com/recaptcha/api/siteverify');
    httpClient.setRequestHeader(
        'Content-type',
        'application/x-www-form-urlencoded; charset=UTF-8'
    );
    httpClient.send(postData);

    if (httpClient.statusCode === 200) {
        var postResponse = JSON.parse(httpClient.text);
        if (postResponse.success && postResponse.score >= score) {
            valid = true;
        }
    }

    return valid;
}

/**
 * 
 * @param {string} pageName - page name for score
 * @returns {number} - page score
 */
function pageScore(pageName) {
    var pagesScore = dw.system.Site.getCurrent().getCustomPreferenceValue(
        'googleRecaptchaPageScore'
    );
    var pagesScoreJson = JSON.parse(pagesScore);
    var score = dw.system.Site.getCurrent().getCustomPreferenceValue(
        'googleRecaptchaPageDefaultScore'
    );
    if (Object.prototype.hasOwnProperty.call(pagesScoreJson, pageName)) {
        score = pagesScoreJson[pageName];
    }
    return score;
}

module.exports = {
    verifyGoogleCaptcha: verifyGoogleCaptcha,
    pageScore: pageScore
};
