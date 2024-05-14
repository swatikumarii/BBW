'use strict';

var RECENT_FAQ_COOKIE = 'recent_faq';

/**
 * @param {object} form - Request body
 */
function updateArticleHelpful(form) {
    var actionUrl = $('.article-helpful-url').val();
    $.ajax({
        url: actionUrl,
        method: 'POST',
        data: form,
        success: function (data) {
            $('.article-vote-label').text(data.articleVoteStatusMessage);
        }
    });
}

/**
 * @param {string} cookieName - Cookie name
 * @returns {object} all data from cookie
 */
function getRecentFaqFromCookie(cookieName) {
    var nameEQ = cookieName + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
            return c.substring(nameEQ.length, c.length);
    }
    return '';
}

/**
 * getRecentFaqArticle
 */
function getRecentFaqArticle() {
    var recentFaq = getRecentFaqFromCookie(RECENT_FAQ_COOKIE);
    if (recentFaq) {
        var actionUrl = $('.get-content-asset-url').val();
        var form = {
            contentIds: recentFaq,
            currentContentId: $('.current-content-id').val()
        };
        $.ajax({
            url: actionUrl,
            method: 'POST',
            data: form,
            success: function (data) {
                $('.recent-article-ul').html(data);
            }
        });
    }
}

/**
 * @param {string} currentContentId - currentContentId
 */
function addRecentFaqArticleInCookie(currentContentId) {
    if (currentContentId) {
        var recentFaq = getRecentFaqFromCookie(RECENT_FAQ_COOKIE);
        var recentFaqs = '';
        if (recentFaq) {
            recentFaq = recentFaq.split(',').filter(function (faq) {
                return faq !== currentContentId;
            });
            var i = 0;
            if (recentFaq.length > 4) {
                i = recentFaq.length - 4;
            }
            for (; i < recentFaq.length; i++) {
                recentFaqs += recentFaq[i] + ',';
            }
            recentFaqs += ',' + currentContentId;
        } else {
            recentFaqs = currentContentId;
        }
        var days = 100;
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        var expires = '; expires=' + date.toUTCString();
        document.cookie = RECENT_FAQ_COOKIE + '=' + recentFaqs + expires + '; path=/';
    }
}

/**
 * Ready
 */
$(document).ready(function () {

    getRecentFaqArticle();
    addRecentFaqArticleInCookie($('.current-content-id').val());

    $('.article-vote-up').on('click', function () {
        var form = {
            currentContentId: $('.current-content-id').val(),
            articleHelpful: 1
        };
        updateArticleHelpful(form);
    });

    $('.article-vote-down').on('click', function () {
        var form = {
            currentContentId: $('.current-content-id').val(),
            articleNotHelpful: 0
        };
        updateArticleHelpful(form);
    });
});
