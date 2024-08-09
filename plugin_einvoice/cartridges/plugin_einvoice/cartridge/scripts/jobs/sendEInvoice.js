'use strict';

var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var EInvoiceApi = require('*/cartridge/scripts/service/eInvoiceApis');
var Logger = require('dw/system/Logger');
var loggerEinvoice = Logger.getLogger('EInvoice');

/**
 * Get new token from PWC API
 * @param {object} tokenInfo - token object
 * @returns {object} - token object
 */
function getTokenFromPWC(tokenInfo) {
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
        loggerEinvoice.info(
            'Got submission successfully get by erp id :' +
                submission.custom.erpId
        );
        var responseObject = JSON.parse(submissionAPIResponse.object);
        if (
            responseObject &&
            responseObject.submissions &&
            responseObject.submissions.length > 0
        ) {
            var currentSubmission = responseObject.submissions[0];
            // var Resource = require('dw/web/Resource');
            // var Site = require('dw/system/Site');
            // var URLUtils = require('dw/web/URLUtils');
            // var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
            // var encryptionHelper = require('*/cartridge/scripts/helpers/encryptionHelpers');
            var OrderMgr = require('dw/order/OrderMgr');
            var einvoiveStatusCode = require('*/cartridge/scripts/constant/einvoice_constant');
            // var emailContentHelpers = require('*/cartridge/scripts/helpers/emailContentHelpers');
            var order = OrderMgr.getOrder(submission.custom.orderId);
            if (
                currentSubmission.status === 'Valid' &&
                currentSubmission.invoiceId
            ) {
                loggerEinvoice.info(
                    'Submission is valid : ' + submission.custom.erpId
                );
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
                            order.custom.qrCode = qrCodeResponse.qrcode;
                            order.custom.eInvoiceStatus =
                                einvoiveStatusCode.EINVOICESTATUSCODES.SUCCESS;

                            CustomObjectMgr.remove(submission);
                        });
                        loggerEinvoice.info(
                            'QR code updated successfully : ' +
                                submission.custom.erpId
                        );
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
                                'Mail hook called : ' + submission.custom.erpId
                            );
                        }
                        // var emailObj = {
                        //     to: order.customerEmail,
                        //     subject: Resource.msg(
                        //         'email.subject.einvoice',
                        //         'einvoice',
                        //         null
                        //     ),
                        //     from:
                        //         Site.current.getCustomPreferenceValue(
                        //             'customerServiceEmail'
                        //         ) || 'no-reply@testorganization.com'
                        // };
                        // var encodedOrderNumber = encodeURIComponent(
                        //     encryptionHelper.encryptPin(order.orderNo)
                        // );
                        // emailHelpers.sendEmail(emailObj, 'mail/einvoiceEmail', {
                        //     invoiceUrl: URLUtils.https(
                        //         'Order-InvoiceDownload',
                        //         'token',
                        //         encodedOrderNumber
                        //     ).toString(),
                        //     content: emailContentHelpers.getEmailContent(
                        //         'normal-footer',
                        //         'email-header'
                        //     )
                        // });
                    }
                }
            } else if (
                // response[0].status === 'Invalid' ||
                currentSubmission.status === 'Rejected'
            ) {
                loggerEinvoice.info(
                    'Submission is rejected : ' + submission.custom.erpId
                );
                // eslint-disable-next-line no-loop-func
                Transaction.wrap(function () {
                    order.custom.eInvoiceStatus =
                        einvoiveStatusCode.EINVOICESTATUSCODES.ERROR;
                    CustomObjectMgr.remove(submission);
                });
                loggerEinvoice.info(
                    'Rejection error source : ' + currentSubmission.errorSource
                );
                loggerEinvoice.info(
                    'Rejection reason : ' + currentSubmission.detailedMessage
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
                        'Rejection mail hook called : ' +
                            submission.custom.erpId
                    );
                }
                // var rejectedEmailObj = {
                //     to: order.customerEmail,
                //     subject: Resource.msg(
                //         'email.subject.einvoice.rejected',
                //         'einvoice',
                //         null
                //     ),
                //     from:
                //         Site.current.getCustomPreferenceValue(
                //             'customerServiceEmail'
                //         ) || 'no-reply@testorganization.com'
                // };
                // emailHelpers.sendEmail(
                //     rejectedEmailObj,
                //     'mail/einvoiceEmailRejected',
                //     {
                //         orderId: submission.custom.orderId,
                //         content: emailContentHelpers.getEmailContent(
                //             'normal-footer',
                //             'email-header'
                //         )
                //     }
                // );
            } else {

                 loggerEinvoice.info(
                     'Rejection error source : ' + currentSubmission.errorSource
                 );
                 loggerEinvoice.info(
                     'Rejection reason : ' + currentSubmission.detailedMessage
                 );
                // TODO: log error in logs
                // eslint-disable-next-line no-loop-func
                Transaction.wrap(function () {
                    order.custom.eInvoiceStatus =
                        einvoiveStatusCode.EINVOICESTATUSCODES.ERROR;
                    CustomObjectMgr.remove(submission);
                });
            }
        } else {
            loggerEinvoice.info(
                'Submission not found : ' + submission.custom.erpId + " Date : " + new Date()
            )           
        }
    } else if (!isRecursive && submissionAPIResponse.error === 401) {
        // TODO: log token errors in logger
         loggerEinvoice.info(
             'Token Unauthorized');  
        updateSubmission(getTokenFromPWC(tokenInfo), submission, true);
    }
}

/**
 * @description This function is run by the job to send EInvoice to the customers.
 */
function sendEInvoice() {
    var tokenInfo = getToken();
    if (!tokenInfo) {
        return;
        loggerEinvoice.info('Used token found : ' + JSON.stringify(tokenInfo));
    }
    loggerEinvoice.info('No token found');

    var submissions = CustomObjectMgr.getAllCustomObjects('eInvoiceDetails');

    loggerEinvoice.info('Submission found : ' + submissions.length);

    while (submissions.hasNext()) {
        var submission = submissions.next();
        loggerEinvoice.info('Submission : ' + JSON.stringify(submission));

        updateSubmission(tokenInfo, submission);
    }
}

module.exports = {
    sendEInvoice: sendEInvoice
};
