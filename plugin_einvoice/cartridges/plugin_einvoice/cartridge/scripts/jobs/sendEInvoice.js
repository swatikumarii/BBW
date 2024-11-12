'use strict';

var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');
var loggerEinvoice = Logger.getLogger('EInvoice');

/**
 * Get new token from PWC API
 * @param {object} tokenInfo - token object
 * @returns {object} - token object
 */
function getTokenFromPWC(tokenInfo) {
    var EInvoiceApi = require('*/cartridge/scripts/service/eInvoiceApis');
    var tokenApiResponse = EInvoiceApi.getEInvoiceToken();
    if (tokenApiResponse.ok) {
        var apiResponse = JSON.parse(tokenApiResponse.object);
        Transaction.wrap(function () {
            // eslint-disable-next-line no-param-reassign
            tokenInfo.custom.token = JSON.stringify({
                type: apiResponse.token_type,
                token: apiResponse.access_token,
                createDate: apiResponse.createdDate,
                validTill: apiResponse.validTill
            });
        });
    } else {
        loggerEinvoice.info('Unable to get token from PWC.');
        // TODO: handle error
    }
    return tokenInfo;
}

/**
 * Get token from custom object or PWC API
 * @returns {object} - token object
 */
function getToken() {
    var tokenInfo = CustomObjectMgr.getCustomObject(
        'eInvoiceTokenInfo',
        'token-info'
    );
    if (
        !tokenInfo ||
        !('token' in tokenInfo.custom && tokenInfo.custom.token)
    ) {
        if (!tokenInfo) {
            tokenInfo = CustomObjectMgr.createCustomObject(
                'eInvoiceTokenInfo',
                'token-info'
            );
        }
        return getTokenFromPWC(tokenInfo);
    }
    return tokenInfo;
}

/**
 * @description This function will send EInvoice to the customers.
 * @param {object} tokenInfo - token object
 * @param {object} submission - submission custom object
 * @param {boolean} isRecursive - is recursive call or not
 */
function updateSubmission(tokenInfo, submission, isRecursive) {
    var EInvoiceApi = require('*/cartridge/scripts/service/eInvoiceApis');
    loggerEinvoice.info('Submission update called.');

    if (!tokenInfo) {
        loggerEinvoice.error('Submission update no token error return false.');
        return;
    }
    // Get EInvoice
    var submissionAPIResponse = EInvoiceApi.getSubmission(
        JSON.parse(tokenInfo.custom.token),
        {
            erpId: submission.custom.erpId
        }
    );
    loggerEinvoice.info('Submission get by erp id :' + submission.custom.erpId);

    if (submissionAPIResponse.ok) {
        var responseObject = JSON.parse(submissionAPIResponse.object);
        if (
            responseObject &&
            responseObject.submissions &&
            responseObject.submissions.length > 0
        ) {
            var currentSubmission = responseObject.submissions[0];
            var OrderMgr = require('dw/order/OrderMgr');
            var einvoiveStatusCode = require('*/cartridge/scripts/constant/einvoice_constant');
            var order = OrderMgr.getOrder(submission.custom.orderId);
            if (
                currentSubmission.status === 'Valid' &&
                currentSubmission.invoiceId
            ) {
                var qrCodeApiResponse = EInvoiceApi.GetQRCode(
                    JSON.parse(tokenInfo.custom.token),
                    {
                        invoiceId: currentSubmission.invoiceId
                    }
                );
                if (qrCodeApiResponse.ok) {
                    var qrCodeResponse = JSON.parse(qrCodeApiResponse.object);
                    if (qrCodeResponse.qrcode) {
                        // eslint-disable-next-line no-loop-func
                        Transaction.wrap(function () {
                            try {
                                var UUIDUtils = require('dw/util/UUIDUtils');
                                // Get EInvoice
                                var uploadQRCodeAPI = EInvoiceApi.uploadQRCode(
                                    {
                                        qrcode: qrCodeResponse.qrcode,
                                        name: UUIDUtils.createUUID() + '.png'
                                    }
                                );
                                if (uploadQRCodeAPI.ok) {
                                    var uploadQRCode = JSON.parse(
                                        uploadQRCodeAPI.object
                                    );
                                    if (
                                        uploadQRCode
                                    ) {
                                        qrCodeResponse.qrCodeLink =
                                            uploadQRCode.url;
                                    }
                                }
                            } catch (error) {
                                loggerEinvoice.error(
                                    'QRCode File upload : ' + error
                                );
                            }
                            order.custom.eInvoiceQrCode =
                                JSON.stringify(qrCodeResponse);
                            order.custom.eInvoiceStatus =
                                einvoiveStatusCode.EINVOICESTATUSCODES.SUCCESS;
                            order.custom.einvoiceErrorMsg = '';

                            CustomObjectMgr.remove(submission);
                        });
                        // Fire a hook to send email from higher cartridges
                        if (
                            require('dw/system/HookMgr').hasHook(
                                'einvoice.email.send'
                            )
                        ) {
                            require('dw/system/HookMgr').callHook(
                                'einvoice.email.send',
                                'sendEmail',
                                order
                            );
                            loggerEinvoice.info(
                                order.orderNo +
                                    ' Mail hook called : ' +
                                    submission.custom.erpId
                            );
                        }
                    }
                }
            } else if (
                currentSubmission.status === 'Invalid' ||
                currentSubmission.status === 'Rejected'
            ) {
                loggerEinvoice.info(
                    order.orderNo +
                        ' Submission is rejected : ' +
                        submission.custom.erpId
                );
                // eslint-disable-next-line no-loop-func
                Transaction.wrap(function () {
                    order.custom.eInvoiceStatus =
                        einvoiveStatusCode.EINVOICESTATUSCODES.ERROR;

                    order.custom.einvoiceErrorMsg = JSON.stringify({
                        errorSource: currentSubmission.errorSource,
                        detailedMessage: currentSubmission.detailedMessage
                    });

                    CustomObjectMgr.remove(submission);
                });
                loggerEinvoice.info(
                    order.orderNo +
                        ' Rejection error source : ' +
                        currentSubmission.errorSource
                );
                loggerEinvoice.info(
                    order.orderNo +
                        ' Rejection reason : ' +
                        currentSubmission.detailedMessage
                );
                // Fire a hook to send email from higher cartridges
                if (
                    require('dw/system/HookMgr').hasHook('einvoice.email.send')
                ) {
                    require('dw/system/HookMgr').callHook(
                        'einvoice.email.send',
                        'sendFailedEmail',
                        order
                    );
                    loggerEinvoice.info(
                        order.orderNo +
                            ' Rejection mail hook called : ' +
                            submission.custom.erpId
                    );
                }
            } else if (
                currentSubmission.erpId &&
                    currentSubmission.status === 'Error'
            ) {
                loggerEinvoice.info(
                    order.orderNo +
                            ' Rejection error source : ' +
                            currentSubmission.errorSource
                );
                loggerEinvoice.info(
                    order.orderNo +
                            ' Rejection reason : ' +
                            currentSubmission.detailedMessage
                );
                // eslint-disable-next-line no-loop-func
                Transaction.wrap(function () {
                    order.custom.eInvoiceStatus =
                            einvoiveStatusCode.EINVOICESTATUSCODES.ERROR;
                    order.custom.einvoiceErrorMsg = JSON.stringify({
                        errorSource: currentSubmission.errorSource,
                        detailedMessage: currentSubmission.detailedMessage
                    });
                    CustomObjectMgr.remove(submission);
                });
            } else {
                loggerEinvoice.info(
                    'Submission not found : ' +
                            submission.custom.erpId +
                            ' Date : ' +
                            new Date()
                );
            }
        } else {
            loggerEinvoice.info(
                'Submission not found : ' +
                    submission.custom.erpId +
                    ' Date : ' +
                    new Date()
            );
        }
    } else if (!isRecursive && submissionAPIResponse.error === 401) {
        loggerEinvoice.info('Token Unauthorized');
        updateSubmission(getTokenFromPWC(tokenInfo), submission, true);
    }
}

/**
 * @description This function is run by the job to send EInvoice to the customers.
 */
function sendEInvoice() {
    var tokenInfo = getToken();
    if (!tokenInfo) {
        loggerEinvoice.info('No token found');
        return;
    }

    var submissions = CustomObjectMgr.getAllCustomObjects('eInvoiceDetails');

    while (submissions.hasNext()) {
        var submission = submissions.next();
        updateSubmission(tokenInfo, submission);
    }
}

module.exports = {
    sendEInvoice: sendEInvoice
};
