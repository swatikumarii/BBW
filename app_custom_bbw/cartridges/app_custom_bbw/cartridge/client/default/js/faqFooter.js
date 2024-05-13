'use strict';

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

function showRecentFaqArticleFromCookie() {
    var days = 100;
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    var expires = '; expires=' + date.toUTCString();
    document.cookie =
        'rituals_locale=' + localeCode + expires + '; path=/';
}

function addRecentFaqArticleInCookie(currentContentId) {
    var days = 100;
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    var expires = '; expires=' + date.toUTCString();
    document.cookie = 'rituals_locale=' + localeCode + expires + '; path=/';
}

/**
 * Ready
 */
$(document).ready(function () {

    showRecentFaqArticleFromCookie();
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
