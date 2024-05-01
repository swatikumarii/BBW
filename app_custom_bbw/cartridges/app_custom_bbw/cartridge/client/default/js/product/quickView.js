'use strict';

var base = require('./base');

/**
 * Generates the modal window on the first call.
 */
function getModalHtmlElement() {
    if ($('#quickViewModal').length !== 0) {
        $('#quickViewModal').remove();
    }
    var htmlString =
        '<!-- Modal -->' +
        '<div class="modal fade" id="quickViewModal" role="dialog">' +
        '<span class="enter-message sr-only" ></span>' +
        '<div class="modal-dialog quick-view-dialog  modal-dialog-centered">' +
        '<!-- Modal content-->' +
        '<div class="modal-content border-0">' +
        '<div class="modal-header border-bottom-0">' +
        '    <button type="button" class="close h-bg--gray-1 pull-right" data-dismiss="modal">' +
        '    </button>' +
        '</div>' +
        '<div class="modal-body"></div>' +
        '<div class="modal-footer border-top-0"></div>' +
        '</div>' +
        '</div>' +
        '</div>';
    $('body').append(htmlString);
}

/**
 * Parse HTML code in Ajax response
 * @param {string} html - Rendered HTML from quickview template
 * @returns {object} - QuickView content components
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.product-quickview');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * replaces the content in the modal window on for the selected product variation.
 * @param {string} selectedValueUrl - url to be used to retrieve a new product model
 */
function fillModalElement(selectedValueUrl) {
    $('#quickViewModal .modal-body').spinner().start();
    $.ajax({
        url: selectedValueUrl,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            var parsedHtml = parseHtml(data.renderedTemplate);

            $('#quickViewModal .modal-body').empty();
            $('#quickViewModal .modal-body').html(parsedHtml.body);
            $('#quickViewModal .modal-footer').html(parsedHtml.footer);
            $('#quickViewModal .modal-footer').html(
                '<a class="full-pdp-link" href='+ data.productUrl +'>'+ data.quickViewFullDetailMsg +'</a>'
            );
            $('#quickViewModal .modal-header .close .sr-only').text(data.closeButtonText);
            $('#quickViewModal .enter-message').text(data.enterDialogMessage);
            $('#quickViewModal').modal('show');
            $('body').trigger('quickview:ready');

            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

module.exports = $.extend({}, base, {
    showQuickview: function () {
        $('body').on('click', '.quickview', function (e) {
            e.preventDefault();
            var selectedValueUrl = $(this).closest('a.quickview').attr('href');
            $(e.target).trigger('quickview:show');
            getModalHtmlElement();
            fillModalElement(selectedValueUrl);
        });
    },
});
