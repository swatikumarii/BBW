'use strict';

/**
 * Showing the content for show more functionality
 */
$(document).ready(function () {
    (require('./thirdParty/video-popup/videoPopup'));
    // Initially hide all childcontent items
    $('.m-grid-contain-childblog').each(function () {
        var $childblogs = $(this).find('.blog_child_content');
        $childblogs.hide();
        $childblogs.slice(0, 4).show();
    });

    // When the show more button is clicked
    $('.show-more-btn').on('click', function (event) {
        // Prevent default behavior
        event.preventDefault();

        // Toggle the visibility of childcontent items
        var showBlog = $(this).parent('.blog_list').find('.blog_child_content');

        showBlog.show();
        $(this).remove();
    });
});
