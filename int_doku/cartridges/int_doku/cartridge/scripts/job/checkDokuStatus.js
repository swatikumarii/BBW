/* eslint-disable vars-on-top */
'use strict';

var Status = require('dw/system/Status');

/**
* Updates Doku Pending Payments at the End of Day
*/
function checkPendingStatus() {
  var CustomObjectMgr = require('dw/object/CustomObjectMgr');
  var OrderMgr = require('dw/order/OrderMgr');
  var dokuHelper = require('*/cartridge/scripts/helpers/dokuHelper');
  var dokuApi = require('*/cartridge/scripts/service/dokuApi');
  var dokuPreference = require('*/cartridge/scripts/service/dokuPreference');
  var OrderIds = CustomObjectMgr.getAllCustomObjects('dokuPendingStatus').asList();
  if (OrderIds.length > 0) {
    for (var count = 0; count < OrderIds.length; count++) {
      var orderId = OrderIds[count].custom.orderID.replace(dokuPreference.request_Id, '');
      var order = OrderMgr.getOrder(OrderIds[count].custom.orderID.replace(dokuPreference.request_Id, ''));
      if (!order) {
        continue;
      }
      var paymentStatusData = JSON.parse(dokuApi.getOrderPaymentStatus(orderId).object);
      var transactionStatus = paymentStatusData.transaction.status;
      if (transactionStatus === dokuPreference.TransactionSuccess) {
        dokuHelper.placeOrder(order, false, paymentStatusData);
      } else if (transactionStatus === dokuPreference.TransactionPending) {
        dokuHelper.pendingOrder(order, false, paymentStatusData);
      } else if (transactionStatus === dokuPreference.TransactionFailed || transactionStatus === dokuPreference.TransactionExpired || transactionStatus === dokuPreference.TransactionTimeout) {
        dokuHelper.failOrder(order, false, paymentStatusData);
      }
    }
  }
  return new Status(Status.OK);
}

module.exports = {
  checkPendingStatus: checkPendingStatus
};
