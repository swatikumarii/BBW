'use strict';

$(document).on('click', '#invoiceDownload', function () {
    var invoiceUrl = $(this).data('action');
    // Make an AJAX request to retrieve the file data
    $.ajax({
        url: invoiceUrl,
        method: 'GET',
        // xhrFields: {
        //     responseType: 'blob'
        // },
        success: function (data) {
            if (data) {
                var printDiv = data;
                var printArea = window.open('', '', 'height=1000, width=1000');
                if (printArea) {
                    printArea.document.write(printDiv);
                    printArea.document.close();
                    printArea.onload = function () {
                        printArea.print();
                    };
                }
            }
        }
    });
});
