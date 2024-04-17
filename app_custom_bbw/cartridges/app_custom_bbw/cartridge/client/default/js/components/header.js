'use strict';

/**
 * To upen login popup
 */
function openLoginPopup() {
    $('.loginPopup').find('.modal').modal('show');
}
module.exports = function () {
    $('#loginPopupBtn').on('click', openLoginPopup);
};
