'use strict';

/* eslint no-param-reassign: ["error", { "props": false }] */
exports.afterPATCH = function (order, orderInput) {
    var Transaction = require('dw/system/Transaction');
    var Site = require('dw/system/Site');
    var Order = require('dw/order/Order');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var OrderModel = require('*/cartridge/models/order');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var encryptionHelper = require('*/cartridge/scripts/helpers/encryptionHelpers');
    var emailContentHelpers = require('*/cartridge/scripts/helpers/emailContentHelpers');
    var ContentMgr = require('dw/content/ContentMgr');
    var orderStatus = orderInput.status || null;
    var exportStatus = orderInput.exportStatus || null;
    var shipment = orderInput.shipments || null;
    var readyToShip = orderInput.c_ready_to_ship || null;
    var Logger = require('dw/system/Logger');
    var logger = Logger.getLogger('OrderTrigger');
    // Order object data
    var orderModel = new OrderModel(order, { containerView: 'order' });
    var encodedOrderNumber = encodeURIComponent(
        encryptionHelper.encryptPin(orderModel.orderNumber)
    );
    var orderObject = {
        order: orderModel,
        invoiceUrl: URLUtils.https(
            'Order-InvoiceDownload',
            'token',
            encodedOrderNumber
        ).toString(),
        content: emailContentHelpers.getEmailContent('normal-footer', 'email-header')
    };
    var emailObj = {
        to: orderModel.orderEmail,
        subject: Resource.msg('email.subject.order.process', 'order', null),
        from:
            Site.current.getCustomPreferenceValue('customerServiceEmail') ||
            'no-reply@testorganization.com'
    };

    // update export status
    logger.info(
        'Export Status is ' +
            order.exportStatus.value +
            'and is setting to ' +
            exportStatus
    );
    if (
        exportStatus !== null &&
        exportStatus === 'exported' &&
        order.exportStatus.value !== Order.EXPORT_STATUS_EXPORTED
    ) {
        logger.info('Inside the export condition');
        Transaction.wrap(function () {
            order.setExportStatus(Order.EXPORT_STATUS_EXPORTED);
        });
        logger.info('After Updating export status');

        // Trigger exported email
        logger.info('order model is ' + JSON.stringify(orderModel));
        emailHelpers.sendEmail(
            emailObj,
            'mail/orderStatus/orderExportedEmail',
            orderObject
        );
    }

    // Update Shipment information
    // Below section is to handle two shipping providers for AU (Using Static code as per Veera's Request)
    var multipleShippers = true;
    var trackingUrl = Site.getCurrent().getCustomPreferenceValue('trackingUrl');
    var carrier = Site.getCurrent().getCustomPreferenceValue('carrier');
    if (trackingUrl.indexOf(',') !== -1) {
        trackingUrl = trackingUrl.split(',');
        carrier = carrier.split(',');
    } else {
        multipleShippers = false;
    }
    if (multipleShippers) {
        if (
            shipment[0].tracking_number.substring(0, 1) === 'C' ||
            shipment[0].tracking_number.substring(0, 1) === 'c'
        ) {
            trackingUrl = trackingUrl[0];
            carrier = carrier[0];
        } else {
            trackingUrl = trackingUrl[1];
            carrier = carrier[1];
        }
    }
    if (
        shipment &&
        shipment.length > 0 &&
        order.shipments.length > 0 &&
        order.shipments[0].trackingNumber === null
    ) {
        Transaction.wrap(function () {
            if (order.shipments.length > 0) {
                order.shipments[0].trackingNumber = shipment[0].tracking_number;
                order.shipments[0].custom.trackingUrl = trackingUrl;
                order.shipments[0].custom.carrier = carrier;
                order.shipments[0].shippingStatus =
                    Order.SHIPPING_STATUS_SHIPPED;
                order.setShippingStatus(Order.SHIPPING_STATUS_SHIPPED);
                order.setExportStatus(Order.EXPORT_STATUS_EXPORTED);
                order.trackOrderChange(
                    Resource.msg('order.history.shipped', 'order', null)
                );
            }
        });

        var shippedEmailMarkup = '';
        var shippedEmailFooterMarkup = '';
        var shippedemailContent = ContentMgr.getContent('email-good-to-konw-shipped-block'); // Canceled Order Email Content Asset Id
        var cancelEmailFooterContent = ContentMgr.getContent('email-order-confirmation'); // Canceled Order Email Footer Image Content Asset Id

        if (!empty(shippedemailContent) && shippedemailContent.online) {
            shippedEmailMarkup = shippedemailContent.custom.body.markup;
        }

        if (!empty(cancelEmailFooterContent) && cancelEmailFooterContent.online) {
            shippedEmailFooterMarkup = cancelEmailFooterContent.custom.body.markup;
        }


        emailObj.subject = Resource.msg(
            'email.subject.order.ready.to.ship',
            'order',
            null
        );

        var shippedorderObject = {
            order: orderModel,
            content: emailContentHelpers.getEmailContent('normal-footer', 'email-header'),
            markup: shippedEmailMarkup,
            footermarkup: shippedEmailFooterMarkup
        };

        // Trigger shipping email
        emailObj.subject = Resource.msg(
            'email.subject.order.shipping',
            'order',
            null
        );
        emailHelpers.sendEmail(
            emailObj,
            'mail/orderStatus/orderShippingEmail',
            shippedorderObject
        );
    }

    logger.info(
        'Order Status ' +
            order.status.value +
            'and is setting to ' +
            orderStatus
    );
    if (
        orderStatus &&
        orderStatus === 'completed' &&
        order.status.value === dw.order.Order.ORDER_STATUS_COMPLETED
    ) {
        logger.info('Inside the status condition');
        // Update the order history
        Transaction.wrap(function () {
            order.trackOrderChange(
                Resource.msg('order.history.completed', 'order', null)
            );
        });
        // Trigger exported email
        logger.info('After Updating export status');
        logger.info('order model is ' + JSON.stringify(OrderModel));
        emailObj.subject = Resource.msg(
            'email.subject.order.completed',
            'order',
            null
        );
        emailHelpers.sendEmail(
            emailObj,
            'mail/orderStatus/orderCompletedEmail',
            orderObject
        );
    }

    // trigger cancel order status email
    if (
        orderStatus &&
        orderStatus === 'cancelled' &&
        order.status.value === dw.order.Order.ORDER_STATUS_CANCELLED
    ) {
        // Update the order history
        Transaction.wrap(function () {
            order.trackOrderChange(
                Resource.msg('order.history.cancelled', 'order', null)
            );
        });
        emailObj.subject = Resource.msg(
            'email.subject.order.cancelled',
            'order',
            null
        );

        var cancelEmailMarkup = '';
        var cancelEmailFooterMarkup = '';
        var emailContent = ContentMgr.getContent('email-good-to-konw-block'); // Canceled Order Email Content Asset Id
        var emailFooterContent = ContentMgr.getContent('email-order-confirmation'); // Canceled Order Email Footer Image Content Asset Id

        if (!empty(emailContent) && emailContent.online) {
            cancelEmailMarkup = emailContent.custom.body.markup;
        }

        if (!empty(emailFooterContent) && emailFooterContent.online) {
            cancelEmailFooterMarkup = emailFooterContent.custom.body.markup;
        }

        var cancelorderObject = {
            order: orderModel,
            invoiceUrl: URLUtils.https(
                'Order-InvoiceDownload',
                'token',
                encodedOrderNumber
            ).toString(),
            content: emailContentHelpers.getEmailContent('normal-footer', 'email-header'),
            markup: cancelEmailMarkup,
            footermarkup: cancelEmailFooterMarkup
        };
        emailHelpers.sendEmail(
            emailObj,
            'mail/orderStatus/orderCancelledEmail',
            cancelorderObject
        );
    }
    // trigger ready to ship email
    if (readyToShip === true && order.custom.readyToShip !== true) {
        Transaction.wrap(function () {
            order.custom.readyToShip = true;
        });
        emailObj.subject = Resource.msg(
            'email.subject.order.ready.to.ship',
            'order',
            null
        );
        emailHelpers.sendEmail(
            emailObj,
            'mail/orderStatus/orderReadyToShipEmail',
            orderObject
        );
    }
};
