'use strict';

var server = require('server');

server.extend(module.superModule);

/**
 *  Handle Ajax payment (and billing) form submit
 */
server.prepend('SubmitPayment', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var BasketMgr = require('dw/order/BasketMgr');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    var paymentForm = server.forms.getForm('billing');
    var contactInfoFormErrors = COHelpers.validateFields(
        paymentForm.contactInfoFields
    );
    var formFieldErrors = [];
    if (Object.keys(contactInfoFormErrors).length) {
        formFieldErrors.push(contactInfoFormErrors);
    } else {
        Transaction.wrap(function () {
            currentBasket.setCustomerEmail(
                paymentForm.contactInfoFields.email.value
            );
        });
    }

    next();
});

module.exports = server.exports();
