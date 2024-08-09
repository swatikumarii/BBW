'use strict';

/**
 * @namespace Einvoice
 */

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var einvoiceHelpers = require('*/cartridge/scripts/helpers/einvoiceHelpers');
var Logger = require('dw/system/Logger');
var loggerEinvoice = Logger.getLogger('EInvoice');

/**
 * Handles GET requests to show e-invoice data
 * Validates the creation date of the order
 */
server.get(
    'Show',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var order = OrderMgr.getOrder(req.querystring.orderId); // Retrieve order using orderId (orderId should be defined or passed in some way)

        // Return JSON response with the validity of the order's creation date
        res.json({
            isValid: einvoiceHelpers.isValidDate(order.creationDate)
        });
        return next();
    }
);

/**
 * Handles POST requests to submit e-invoice data
 * Validates and processes e-invoice submission
 */
server.post(
    'Submit',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var UUIDUtils = require('dw/util/UUIDUtils');
        var EInvoiceApi = require('*/cartridge/scripts/service/eInvoiceApis');
        var EInvoiceMdl = require('*/cartridge/models/eInvoiceModel');
        var customObjectMgr = require('dw/object/CustomObjectMgr');
        var Transaction = require('dw/system/Transaction');
        var einvoiveStatusCode = require('*/cartridge/scripts/constant/einvoice_constant');

        // Retrieve parameters from the request
        var tinNumber = req.httpParameterMap.get('tinNumber').stringValue;
        var regNumber = req.httpParameterMap.get('regNumber').stringValue;
        var orderId = req.httpParameterMap.get('orderID').stringValue;
        var identificationType =
            req.httpParameterMap.get('identificationType').stringValue;
        var sstNumber =
            req.httpParameterMap.get('sSTNumber').stringValue || 'NA';

        // Validate mandatory fields
        if (tinNumber === '' || regNumber === '') {
            res.json({
                status: false,
                type: 'field_error',
                errorMsg: Resource.msg(
                    'field.server.error',
                    'einvoice_modal',
                    null
                )
            });

            loggerEinvoice.error(
                'Tin number and registery number is required.'
            );

            return next();
        }

        try {
            var order = OrderMgr.getOrder(orderId); // Retrieve order using orderId

            loggerEinvoice.info('Order-id : ' + orderId);

            // Validate order creation date
            if (!einvoiceHelpers.isValidDate(order.creationDate)) {
                res.json({
                    status: false,
                    errorMsg: Resource.msg(
                        'einvoice.submittion.date.error',
                        'einvoice_modal',
                        null
                    )
                });

                loggerEinvoice.error(
                    'User trying to submit the invoice in different month.'
                );

                return next();
            }

            // Check e-invoice status of the order
            if (
                !order.custom.hasOwnProperty('eInvoiceStatus') ||
                order.custom.eInvoiceStatus ===
                    einvoiveStatusCode.EINVOICESTATUSCODES.ERROR ||
                order.custom.eInvoiceStatus ===
                    einvoiveStatusCode.EINVOICESTATUSCODES.EMPTY
            ) {
                loggerEinvoice.info('No e-invoice associated with this order.');

                // Get e-invoice token
                var tokenApiResponse = EInvoiceApi.getEInvoiceToken();
                if (tokenApiResponse.ok) {
                    var response = JSON.parse(tokenApiResponse.object);

                    loggerEinvoice.info('Got token.');

                    // Prepare buyer's data
                    var buyersData = {
                        tinNumber: tinNumber,
                        sstNumber: sstNumber,
                        identificationType: identificationType,
                        regNumber: regNumber
                    };

                    // Prepare reference data
                    var referenceData = {
                        currentDateTime: new Date(),
                        erpId: UUIDUtils.createUUID()
                    };

                    // Prepare token information
                    var tokenInfo = {
                        type: response.token_type,
                        token: response.access_token,
                        createDate: response.createdDate,
                        validTill: response.validTill
                    };

                    loggerEinvoice.info(
                        'Invoice reference data : ' + referenceData
                    );

                    // Create invoice request JSON
                    var invoiceRequestJson = EInvoiceMdl.eInvoice(
                        order,
                        referenceData,
                        buyersData
                    );

                    if (invoiceRequestJson) {
                        loggerEinvoice.info(
                            'Invoice request : ' +
                                JSON.stringify(invoiceRequestJson)
                        );

                        // Submit e-invoice
                        var submissionApiResponse = EInvoiceApi.postSubmission(
                            invoiceRequestJson,
                            tokenInfo,
                            referenceData
                        );

                        loggerEinvoice.info(
                            'Submission Api response : ' + submissionApiResponse
                        );

                        if (submissionApiResponse.ok) {
                            loggerEinvoice.info(
                                'Invoice submitted successfully'
                            );

                            referenceData.invoiceId =
                                invoiceRequestJson.invoiceId;
                            referenceData.orderId = invoiceRequestJson.orderId;

                            // Store e-invoice details in a custom object
                            Transaction.wrap(function () {
                                var backInStockObj =
                                    customObjectMgr.createCustomObject(
                                        'eInvoiceDetails',
                                        referenceData.erpId
                                    );
                                backInStockObj.custom.orderId =
                                    referenceData.orderId;
                                backInStockObj.custom.eInvoiceId =
                                    referenceData.invoiceId;                               

                                // Update order custom attributes with e-invoice details
                                order.custom.eInvoiceSubmittionDate =
                                    referenceData.currentDateTime;
                                order.custom.eInvoiceErpId =
                                    referenceData.erpId;
                                order.custom.eInvoiceNumber =
                                    referenceData.invoiceId;
                                order.custom.eInvoiceStatus = 'pending';
                            });

                            // Return success response
                            res.json({
                                status: true,
                                successMsg: Resource.msg(
                                    'einvoice.submittion.success',
                                    'einvoice_modal',
                                    null
                                )
                            });

                            loggerEinvoice.info(
                                'Response captured successfully'
                            );
                        } else {
                            res.json({
                                status: false,
                                errorMsg: Resource.msg(
                                    'einvoice.submittion.error',
                                    'einvoice_modal',
                                    null
                                )
                            });
                            loggerEinvoice.info(
                                'Supplier Response error.'
                            );
                        }
                    } else {
                        loggerEinvoice.error('Invoice submission error');
                        // Handle submission error
                        res.json({
                            status: false,
                            errorMsg: Resource.msg(
                                'einvoice.submittion.error',
                                'einvoice_modal',
                                null
                            )
                        });
                    }
                } else {
                    loggerEinvoice.error('Token error');
                    // Handle token validation error
                    res.json({
                        status: false,
                        errorMsg: Resource.msg(
                            'einvoice.token.validation.error',
                            'einvoice_modal',
                            null
                        )
                    });
                }
            } else if (
                order.custom.eInvoiceStatus ===
                einvoiveStatusCode.EINVOICESTATUSCODES.PENDING
            ) {
                loggerEinvoice.info(
                    'E-invoice already submitted status: pending'
                );
                // Handle pending e-invoice status
                res.json({
                    status: false,
                    type: 'e_invoice_status',
                    errorMsg: Resource.msg(
                        'einvoice.pending.status',
                        'einvoice_modal',
                        null
                    )
                });
            } else {
                loggerEinvoice.info(
                    'E-invoice already generated status: success'
                );
                // Handle other e-invoice statuses
                Transaction.wrap(function () {
                    var backInStockObj = customObjectMgr.createCustomObject(
                        'eInvoiceDetails',
                        order.custom.eInvoiceErpId
                    );
                    backInStockObj.custom.orderId =
                        order.custom.eInvoiceErpId;
                    backInStockObj.custom.eInvoiceId =
                        order.custom.eInvoiceNumber;                   

                    res.json({
                        status: true,
                        successMsg: Resource.msg(
                            'einvoice.submittion.success',
                            'einvoice_modal',
                            null
                        )
                    });
                    loggerEinvoice.info('response captured successfully.');
                });
            }
        } catch (ex) {
            loggerEinvoice.info('Unhandeled exception: ' + ex);
            // Handle any unexpected errors
            res.json({
                status: false,
                errorMsg: Resource.msg(
                    'einvoice.token.validation.error',
                    'einvoice_modal',
                    null
                )
            });
        }
        return next();
    }
);

module.exports = server.exports();
