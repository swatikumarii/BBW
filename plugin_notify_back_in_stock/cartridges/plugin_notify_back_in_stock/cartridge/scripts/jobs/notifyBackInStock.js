'use strict';


/**
 * @description This function is run by the job & call hook to send email
 * to the users if product is back in stock
 */
function sendEmail() {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var pendingList = CustomObjectMgr.getAllCustomObjects('notifyBackInStock');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var Transaction = require('dw/system/Transaction');
    var Logger = require('dw/system/Logger');
    var NotifyObjectLogger = Logger.getLogger('NotifyBackInStock');
    var NotifyEmailLogger = Logger.getLogger('NotifyEmail');
    var Site = require('dw/system/Site');
    var HookMgr = require('dw/system/HookMgr');
    var ArrayList = require('dw/util/ArrayList');
    var emailsArray = {};
    var recordArray = [];
    var threshold;
    var notifyEmailThreshold = Site.getCurrent().getCustomPreferenceValue('notifyEmailThreshold');
    while (pendingList.hasNext()) {
        var record = pendingList.next();
        var product = ProductFactory.get({ pid: record.custom.productID });
        if (HookMgr.hasHook('notify.backInStock.threshold')) {
            threshold = HookMgr.callHook(
                'notify.backInStock.threshold',
                'getThresholdWithReserveStock',
                product
            );
        } else {
            threshold = product.notifyMeThreshold ? product.notifyMeThreshold : notifyEmailThreshold;
        }
        if (threshold && (product.availableToSell >= threshold || product.perpetual) && product.available && product.readyToOrder) {
            var userObj = JSON.parse(record.custom.user);
            var emailList = [];
            for (var j = 0; j < userObj.length; j++) {
                emailList.push(userObj[j].email);
            }
            for (var i = 0; i < emailList.length; i++) {
                if (!emailsArray[emailList[i]]) {
                    emailsArray[emailList[i]] = record.custom.productID;
                } else {
                    var pid = emailsArray[emailList[i]];
                    pid += ',' + record.custom.productID;
                    emailsArray[emailList[i]] = pid;
                }
            }
            recordArray.push(record);
        }
    }
    Object.keys(emailsArray).forEach(function (key) {
        var pIds = emailsArray[key];
        var pIdArr = new ArrayList(pIds.split(','));
        var productDetails = [];
        for (var counter = 0; counter < pIdArr.length; counter++) {
            var productInfo = ProductFactory.get({ pid: pIdArr[counter] });
            productDetails.push({
                id: productInfo.id,
                name: productInfo.productName,
                imageUrl: productInfo.images && 'mediumLarge' in productInfo.images && productInfo.images.mediumLarge.length ? productInfo.images.mediumLarge[0].url : productInfo.images.small[0].url
            });
        }
        if (productDetails.length > 0) {
            try {
                Transaction.wrap(function () {
                    // using hook to send emails
                    HookMgr.callHook('notify.backInStock.email', 'sendMail', {
                        email: key,
                        product: productDetails
                    });
                });
            } catch (ex) {
                NotifyEmailLogger.error('Error in Notify Mails => ' + ex);
            }
        }
    });
    // remove records after mail send
    var currentDate = new Date().toLocaleString();
    var newBackInStock;
    Transaction.wrap(function () {
        for (var counter = 0; counter < recordArray.length; counter++) {
            try {
                newBackInStock = CustomObjectMgr.createCustomObject('notifyBackInStockBackUp', recordArray[counter].custom.productID + '-' + currentDate);
                newBackInStock.custom.user = recordArray[counter].custom.user;
                CustomObjectMgr.remove(recordArray[counter]);
            } catch (ex) {
                NotifyObjectLogger.error('Error in notifyBackInStockBackUp Object => ' + ex);
            }
        }
    });
    pendingList.close();
}

module.exports = {
    sendEmail: sendEmail
};
