'use strict';

/**
 * @namespace Popup
 */

var server = require('server');

/**
 * Popup-PopupCnfig : This Controller Handles Dynamic Popup Modal
 * @name Popup-PopupConfig
 * @function
 * @memberof Popup
 * @param {querystringparameter} url - url
 * @param {renders} json - json
 */
server.get('PopupConfig', function (req, res, next) {
    var WindowLocation = req.querystring.url || '';
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var registered = req.currentCustomer.raw.registered;
    var co = CustomObjectMgr.queryCustomObject(
        'DynamicPopup',
        'custom.url = {0}',
        WindowLocation || null
    );
    if (co) {
        var popupUrl = co.custom.url;
        var popupName = co.custom.popupName;
        var dynamicPopupUrl = CustomObjectMgr.getCustomObject(
            'DynamicPopup',
            popupName
        );
        popupUrl = dynamicPopupUrl.custom.url;
        var popupPosition = dynamicPopupUrl.custom.position.value;
        var popupContent = dynamicPopupUrl.custom.popupContent.markup;
        var popupVisibility = dynamicPopupUrl.custom.visibility.value;
        var popupSize = dynamicPopupUrl.custom.size.value;
        var popupFrequency = dynamicPopupUrl.custom.frequency.value;
        var popupAnimation = dynamicPopupUrl.custom.animationPopup.value;
        var popupTrigger = dynamicPopupUrl.custom.popupTrigger.value;
        var popupDelayTime = dynamicPopupUrl.custom.delayTime * 1000;
        var popupAutocloseTime = dynamicPopupUrl.custom.autoCloseTime * 1000;
        var popupCloseButtonPosition =
            dynamicPopupUrl.custom.closeButtonPosition.value;
        var popupEnabled = dynamicPopupUrl.custom.popupEnabled;
        var popupClickEventId = dynamicPopupUrl.custom.popupClickEventId;
        var popupScroll;
        if (popupTrigger === 'onScroll') {
            if (dynamicPopupUrl.custom.scrollPercent) {
                popupScroll = dynamicPopupUrl.custom.scrollPercent;
            } else {
                popupScroll = 50;
            }
        } else {
            popupScroll = null;
        }
        if (!popupCloseButtonPosition) {
            popupCloseButtonPosition = 'outside';
        }
        // checking the visibility access of the popup
        var popupVisibilityFlag;
        if (
            (popupVisibility === 'registered' && registered === true) ||
            (popupVisibility === 'non-registered' && registered === false) ||
            popupVisibility === 'all'
        ) {
            popupVisibilityFlag = true;
        }
        res.json({
            success: true,
            popupUrl: popupUrl,
            popupPosition: popupPosition,
            popupContent: popupContent,
            popupVisibilityFlag: popupVisibilityFlag,
            popupFrequency: popupFrequency,
            popupTrigger: popupTrigger,
            popupScroll: popupScroll,
            popupEnabled: popupEnabled,
            popupClickEventId: popupClickEventId,
            popupDelayTime: popupDelayTime,
            popupAutocloseTime: popupAutocloseTime,
            popupAnimation: popupAnimation,
            popupSize: popupSize,
            popupCloseButtonPosition: popupCloseButtonPosition
        });
    } else {
        res.json({
            success: false
        });
    }
    next();
});

/**
 * Popup-DynamicFormHandle : This Controller Handles Dynamic Popup Form
 * @name Popup-DynamicFormHandle
 * @function
 * @memberof Popup
 * @param {httpparameter} object - object
 * @param {renders} json - json
 */
server.post('DynamicFormHandle', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Logger = require('dw/system/Logger');
    var DynamicFormLogger = Logger.getLogger('DynamicForm');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var Resource = require('dw/web/Resource');

    var dynamicFormData = req.form;

    // collecting all input fields of dynamic form in object format
    var form = JSON.parse(dynamicFormData.dynamicFormData);
    var customDynamicObjectName = req.querystring.customDynamicObjectName;
    try {
        Transaction.wrap(function () {
            var dynamicFormFields = CustomObjectMgr.createCustomObject(
                customDynamicObjectName,
                UUIDUtils.createUUID()
            );
            Object.keys(form).forEach(function (key) {
                var fieldName = key.toLowerCase();
                dynamicFormFields.custom[fieldName] = form[key];
            });
        });
        res.json({
            success: true,
            messageType: 'alert-success',
            msg: Resource.msg(
                'dynamic.form.data.submission.success',
                'popups',
                null
            )
        });
    } catch (e) {
        DynamicFormLogger.error('Error in DynamicForm => ' + e);
        res.json({
            success: false,
            messageType: 'alert-danger',
            msg: Resource.msg(
                'dynamic.form.data.submission.failure',
                'popups',
                null
            )
        });
    }
    next();
});

module.exports = server.exports();
