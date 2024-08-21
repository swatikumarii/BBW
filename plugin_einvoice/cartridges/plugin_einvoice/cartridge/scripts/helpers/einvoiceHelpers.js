'use strict';

/**
 * Checks if the provided date is in the same month as the current date.
 * @param {Date} date - The date to be validated
 * @returns {boolean} - True if the date is in the same month as the current date, otherwise false
 */
function isValidDate(date) {
    if (date.getMonth() === new Date().getMonth()) {
        return true;
    }
    return false;
}

function eInvoiceStatusCheckNonAjax(res, orderId) {
    var OrderMgr = require('dw/order/OrderMgr');
    var einvoiveStatusCode = require('*/cartridge/scripts/constant/einvoice_constant');
    var order = OrderMgr.getOrder(orderId); // Retrieve order using orderId (orderId should be defined or passed in some way)
    var Resource = require('dw/web/Resource');

    if (
        !'eInvoiceStatus' in order.custom ||
        order.custom.eInvoiceStatus ==
            einvoiveStatusCode.EINVOICESTATUSCODES.EMPTY ||
        order.custom.eInvoiceStatus == null
    ) {
        return {
            status: false,
            btnText: Resource.msg(
                'einvoice.modal.popup.sumbit.btn.text',
                'einvoice_modal',
                null
            )
        };
    } else if (
        'eInvoiceQrCode' in order.custom &&
        order.custom.eInvoiceStatus ==
            einvoiveStatusCode.EINVOICESTATUSCODES.SUCCESS
    ) {
        // Return JSON response with the validity of the order's creation date
        return {
            status: einvoiveStatusCode.EINVOICESTATUSCODES.SUCCESS,
            message: Resource.msg(
                'einvoice.already.generated',
                'einvoice_modal',
                null
            ),
            qrCodeLink: JSON.parse(order.custom.eInvoiceQrCode).url,
            btnText: Resource.msg(
                'einvoice.dowmload.invoice.btn.text',
                'einvoice_modal',
                null
            )
        };
    } else if (
        order.custom.eInvoiceStatus ==
        einvoiveStatusCode.EINVOICESTATUSCODES.PENDING
    ) {
        return {
            status: einvoiveStatusCode.EINVOICESTATUSCODES.PENDING,
            message: Resource.msg(
                'einvoice.pending.status',
                'einvoice_modal',
                null
            ),
            btnText: Resource.msg(
                'einvoice.pending.invoice.btn.text',
                'einvoice_modal',
                null
            )
        };
    } else if (
        order.custom.eInvoiceStatus ==
        einvoiveStatusCode.EINVOICESTATUSCODES.ERROR
    ) {
        return {
            status: einvoiveStatusCode.EINVOICESTATUSCODES.ERROR,
            btnText: Resource.msg(
                'einvoice.failed.invoice.btn.text',
                'einvoice_modal',
                null
            ),
            errorReason:
                'E-invoice error : ' +
                    JSON.parse(order.custom.einvoiceErrorMsg).detailedMessage ||
                ''
        };
    }
    return {};
}

module.exports = {
    isValidDate: isValidDate,
    eInvoiceStatusCheckNonAjax: eInvoiceStatusCheckNonAjax
};
