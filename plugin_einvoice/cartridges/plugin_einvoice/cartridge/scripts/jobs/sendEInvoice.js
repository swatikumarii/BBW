'use strict';

var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var EInvoiceApi = require('*/cartridge/scripts/service/eInvoiceApis');

/**
 * @description This function is run by the job to send EInvoice to the customers.
 */
function sendEInvoice() {
    var tokenInfo = CustomObjectMgr.getCustomObject(
        'eInvoice_token_info',
        'token-info'
    );
    if (
        !tokenInfo ||
        !('token' in tokenInfo.custom && tokenInfo.custom.token)
    ) {
        Transaction.wrap(function () {
            var tokenApiResponse = EInvoiceApi.getEInvoiceToken();
            if (tokenApiResponse.ok) {
                var response = JSON.parse(tokenApiResponse.object);
                tokenInfo = CustomObjectMgr.createCustomObject(
                    'eInvoice_token_info',
                    'token-info'
                );
                tokenInfo.custom.token = JSON.stringify({
                    type: response.token_type,
                    token: response.access_token,
                    createDate: response.createdDate,
                    validTill: response.validTill
                });
            } else {
                // TODO: handle error
            }
        });
    }

    var submissions = CustomObjectMgr.getAllCustomObjects('eInvoice_details');
    while (submissions.hasNext()) {
        var submission = submissions.next();

        // Get EInvoice
        var submissionResponse = EInvoiceApi.getSubmission(tokenInfo, {
            erpId: submission.custom.erp_id
        });
        if (submissionResponse.ok) {
            var response = JSON.parse(submissionResponse.object);
            if (response && response.length > 0) {
                var Resource = require('dw/web/Resource');
                var Site = require('dw/system/Site');
                var URLUtils = require('dw/web/URLUtils');
                var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
                var encryptionHelper = require('*/cartridge/scripts/helpers/encryptionHelpers');
                var OrderMgr = require('dw/order/OrderMgr');
                var order = OrderMgr.getOrder(
                    submission.custom.order_id
                );
                if (response[0].status === 'Valid' && response[0].invoiceId) {
                    var qrCodeApiResponse = EInvoiceApi.GetQRCode(tokenInfo, {
                        invoiceId: response[0].invoiceId
                    });
                    if (qrCodeApiResponse.ok) {
                        var qrCodeResponse = JSON.parse(
                            qrCodeApiResponse.object
                        );
                        if (qrCodeResponse.qrcode) {
                            // eslint-disable-next-line no-loop-func
                            Transaction.wrap(function () {
                                order.custom.qrCode = qrCodeResponse.qrcode;
                                order.custom.eInvoiceStatus = 'Completed';

                                CustomObjectMgr.remove(submission);
                            });

                            var emailObj = {
                                to: order.customerEmail,
                                subject: Resource.msg(
                                    'email.subject.einvoice',
                                    'einvoice',
                                    null
                                ),
                                from:
                                    Site.current.getCustomPreferenceValue(
                                        'customerServiceEmail'
                                    ) || 'no-reply@testorganization.com'
                            };
                            var encodedOrderNumber = encodeURIComponent(
                                encryptionHelper.encryptPin(
                                    submission.custom.order_id
                                )
                            );
                            emailHelpers.sendEmail(
                                emailObj,
                                'mail/einvoiceEmail',
                                {
                                    invoiceUrl: URLUtils.https(
                                        'Order-InvoiceDownload',
                                        'token',
                                        encodedOrderNumber
                                    ).toString()
                                }
                            );
                        }
                    }
                } else if (
                    // response[0].status === 'Invalid' ||
                    response[0].status === 'Rejected'
                ) {
                    // eslint-disable-next-line no-loop-func
                    Transaction.wrap(function () {
                        order.custom.einvoiceStatus = response[0].errorDetails;
                        CustomObjectMgr.remove(submission);
                    });
                    var rejectedEmailObj = {
                        to: order.customerEmail,
                        subject: Resource.msg(
                            'email.subject.einvoice.rejected',
                            'einvoice',
                            null
                        ),
                        from:
                            Site.current.getCustomPreferenceValue(
                                'customerServiceEmail'
                            ) || 'no-reply@testorganization.com'
                    };
                    emailHelpers.sendEmail(
                        rejectedEmailObj,
                        'mail/einvoiceEmailRejected',
                        {
                            orderId: submission.custom.order_id
                        }
                    );
                }
            } else {
                // TODO: log error if there is no response from API
            }
        } else {
            // res.json({
            //     status: false,
            //     error: 'Error while getting submission.'
            // });
            // TODO: log errors in logger
        }
    }
}

module.exports = {
    sendEInvoice: sendEInvoice
};
