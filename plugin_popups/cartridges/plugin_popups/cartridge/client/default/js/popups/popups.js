'use strict';

var modalDialog = '.modal-dialog.dynamic-popup-dialog';
var modalDialogCenter = 'modal-dialog-centered';
var modalContent = '.modal-content.dynamic-popup-content .modal-body';
var modalHeader = '.modal-header';
var closeButton = '.modal-header button.close';
var modalShowClass = 'show';
var modalIdAll = '#dynamic-modal-all';
var modalIdExitIntent = '#dynamic-modal-exit-intent-popup';
var modalIdDefault = '#dynamic-modal';

/**
 * Determines the ID of the popup based on provided parameters.
 * @param {string} name - The name of the popup.
 * @param {boolean} checkExitIntentPopup - Whether to check for exit intent popup.
 * @returns {string} The ID of the popup.
 */
function getPopupId(name, checkExitIntentPopup) {
    if (checkExitIntentPopup) {
        return modalIdExitIntent;
    }
    return name ? modalIdAll : modalIdDefault;
}

/**
 * Checks if the popup is enabled based on the provided data.
 * @param {object} data - The data object containing popup information.
 * @returns {boolean} True if the popup is enabled, otherwise false.
 */
function isPopupEnabled(data) {
    return data.popupVisibilityFlag && data.popupEnabled && data.success;
}

/**
 * Configures the popup based on the provided data.
 * @param {object} data - The data object containing popup information.
 * @param {string} popupId - The ID of the popup.
 */
function configurePopup(data, popupId) {
    var $popup = $(popupId);
    var $modalDialog = $popup.find(modalDialog);
    var popupContent = data.popupContent;

    $popup.addClass(data.popupPosition);
    if (data.popupPosition === 'center') {
        $modalDialog.addClass(modalDialogCenter);
    }
    $popup.find(closeButton).removeClass('d-none');
    $modalDialog.addClass(data.popupSize).addClass(data.popupAnimation);
    $popup.find(modalContent).empty().append(popupContent);
    $popup
        .find(closeButton)
        .addClass(data.popupCloseButtonPosition)
        .removeClass('d-none');
    $popup.find(modalHeader).addClass(data.popupCloseButtonPosition);
}

/**
 * Sets up the trigger for displaying the popup based on the provided data.
 * @param {object} data - The data object containing popup information.
 * @param {string} popupId - The ID of the popup.
 * @param {string} presentWindowLocation - The present window location.
 */
function setupPopupTrigger(data, popupId, presentWindowLocation) {
    var popupUrl = data.popupUrl;
    var popupTrigger = data.popupTrigger;
    var popupClickEventId = data.popupClickEventId;
    var popupDelayTime = data.popupDelayTime;
    var popupScroll = data.popupScroll;
    var popupAutocloseTime = data.popupAutocloseTime;

    switch (popupTrigger) {
        case modalIdExitIntent:
            if (
                localStorage.getItem(popupUrl + presentWindowLocation) ===
                    'true' ||
                sessionStorage.getItem(popupUrl + presentWindowLocation) ===
                    'true'
            ) {
                setTimeout(function () {
                    $(popupId).modal('show');
                    localStorage.setItem(
                        popupUrl + presentWindowLocation,
                        false
                    );
                    sessionStorage.setItem(
                        popupUrl + presentWindowLocation,
                        false
                    );
                    if (popupAutocloseTime > 0) {
                        setTimeout(function () {
                            $(popupId).modal('hide');
                        }, popupAutocloseTime);
                    }
                }, popupDelayTime);
            }
            break;
        case 'onLoad':
            setTimeout(function () {
                $(popupId).modal('show');
                localStorage.setItem(popupUrl + presentWindowLocation, false);
                sessionStorage.setItem(popupUrl + presentWindowLocation, false);
                if (popupAutocloseTime > 0) {
                    setTimeout(function () {
                        $(popupId).modal('hide');
                    }, popupAutocloseTime);
                }
            }, popupDelayTime);
            break;
        case 'onScroll':
            $(window).scroll(function () {
                // var percentScrolled =
                //     ($(window).scrollTop() / $(document).height()) * 100;

                var scrollTop = $(this).scrollTop();
                var documentHeight = $(document).height();
                var windowHeight = window.innerHeight;
                var percentScrolled =
                    (scrollTop / (documentHeight - windowHeight)) * 100;
                if (
                    percentScrolled >= popupScroll &&
                    (localStorage.getItem(popupUrl + presentWindowLocation) ===
                        'true' ||
                        sessionStorage.getItem(
                            popupUrl + presentWindowLocation
                        ) === 'true')
                ) {
                    setTimeout(function () {
                        $(popupId).modal('show');
                        localStorage.setItem(
                            popupUrl + presentWindowLocation,
                            false
                        );
                        sessionStorage.setItem(
                            popupUrl + presentWindowLocation,
                            false
                        );
                        if (popupAutocloseTime > 0) {
                            setTimeout(function () {
                                $(popupId).modal('hide');
                            }, popupAutocloseTime);
                        }
                    }, popupDelayTime);
                }
            });
            break;
        case 'onClick':
            if ($('#' + popupClickEventId).length) {
                $('body').on('click', '#' + popupClickEventId, function () {
                    if (
                        localStorage.getItem(
                            popupUrl + presentWindowLocation
                        ) === 'true' ||
                        sessionStorage.getItem(
                            popupUrl + presentWindowLocation
                        ) === 'true'
                    ) {
                        setTimeout(function () {
                            $(popupId).modal('show');
                            if (popupAutocloseTime > 0) {
                                setTimeout(function () {
                                    $(popupId).modal('hide');
                                }, popupAutocloseTime);
                            }
                        }, popupDelayTime);
                    }
                });
            }
            break;
        case 'onExit':
            $(document).unbind('mouseleave');
            $(document).mouseleave(function () {
                setTimeout(function () {
                    $(popupId).modal('show');
                    localStorage.setItem(
                        popupUrl + presentWindowLocation,
                        false
                    );
                    sessionStorage.setItem(
                        popupUrl + presentWindowLocation,
                        false
                    );
                    if (popupAutocloseTime > 0) {
                        setTimeout(function () {
                            $(popupId).modal('hide');
                        }, popupAutocloseTime);
                    }
                }, popupDelayTime);
            });
            break;
        default:
    }
}

/**
 * Handles the frequency of the popup display based on the provided data.
 * @param {object} data - The data object containing popup information.
 * @param {string} popupId - The ID of the popup.
 * @param {string} presentWindowLocation - The present window location.
 */
function handlePopupFrequency(data, popupId, presentWindowLocation) {
    var popupUrl = data.popupUrl;
    var popupContent = data.popupContent;
    var popupKey = popupUrl + presentWindowLocation;
    var storedPopupContent = localStorage.getItem(
        'PopupContent' + presentWindowLocation
    );

    switch (data.popupFrequency) {
        case 'oneTime':
            if (
                !localStorage.getItem(popupKey) ||
                storedPopupContent !== JSON.stringify(popupContent)
            ) {
                localStorage.setItem(popupKey, true);
                localStorage.setItem(
                    'PopupContent' + presentWindowLocation,
                    JSON.stringify(popupContent)
                );
                setupPopupTrigger(data, popupId, presentWindowLocation);
            } else {
                $(popupId).modal('hide');
            }
            break;
        case 'sessionBased':
            if (!sessionStorage.getItem(popupKey)) {
                sessionStorage.setItem(popupKey, true);
                setupPopupTrigger(data, popupId, presentWindowLocation);
            } else {
                $(popupId).modal('hide');
            }
            break;
        default:
            localStorage.setItem(popupKey, true);
            sessionStorage.setItem(popupKey, true);
            setupPopupTrigger(data, popupId, presentWindowLocation);
    }
}

/**
 * Displays dynamic popup based on provided parameters.
 * @param {string} name - The name of the popup.
 * @param {boolean} checkExitIntentPopup - Whether to check for exit intent popup.
 */
function dynamicPopupShow(name, checkExitIntentPopup) {
    var popupId = getPopupId(name, checkExitIntentPopup);
    var presentWindowLocation = window.location.href;
    var getCartStatusUrl = $(popupId).data('href');

    if (getCartStatusUrl) {
        $.ajax({
            url: getCartStatusUrl + '?url=' + (name || presentWindowLocation),
            method: 'GET',
            success: function (data) {
                if (isPopupEnabled(data)) {
                    configurePopup(data, popupId);
                    handlePopupFrequency(data, popupId, presentWindowLocation);
                }
            }
        });
    }
}

$(document).ready(function () {
    dynamicPopupShow('allSitePopup');
    dynamicPopupShow();

    $(document).mouseleave(function () {
        if (!$(modalIdExitIntent).hasClass(modalShowClass)) {
            dynamicPopupShow('exitIntentPopup', true);
        }
    });

    $('body').on('click', '#dynamic-modal .slick-arrow', function () {
        $('body, html').addClass('overflow-hidden');
    });

    $(
        modalIdAll + ', ' + modalIdAll + ', ' + modalIdExitIntent + ' .close'
    ).click(function () {
        if ($(modalIdDefault).hasClass(modalShowClass)) {
            $('body').addClass('overflow-hidden');
        }
    });

    $(
        modalIdDefault +
            ',' +
            modalIdDefault +
            ',' +
            modalIdExitIntent +
            ' .close'
    ).click(function () {
        $('body').removeClass('overflow-hidden');
    });

    // Event for saving dynamic popup data
    $('body').on('click', '#dynamicPopupSubmit', function (e) {
        e.preventDefault();
        var form = {};
        var invalid = false;
        var $dynamicPopupMsg = $('#dynamicPopupMsg');
        var $dynamicPopupForm = $('form[name=dynamicPopupForm]');
        var $formControls = $dynamicPopupForm.find('.form-control-dynamic');

        $dynamicPopupMsg.empty(); // Clear previous error messages

        $formControls.each(function () {
            var $this = $(this);
            var name = $this.attr('name');
            var value = $this.val();
            var required = $this.prop('required');

            form[name] = value;

            if (required && !value.trim()) {
                $dynamicPopupMsg.append(
                    '<div class="alert alert-danger text-center" role="alert">' +
                        name +
                        ' cannot be empty' +
                        '</div>'
                );
                invalid = true;
            }
        });

        if (invalid) {
            setTimeout(function () {
                $dynamicPopupMsg.empty();
            }, 3000);
            return;
        }

        var dynamicFormData = JSON.stringify(form);
        var customDynamicObjectName =
            $('.dynamicFormClass').data('customobjectname');

        if (customDynamicObjectName) {
            var formData = { dynamicFormData: dynamicFormData };
            var url = $('.dynamicFormClass').val();

            $.spinner().start();
            $.ajax({
                url:
                    url + '?customDynamicObjectName=' + customDynamicObjectName,
                type: 'post',
                dataType: 'json',
                data: formData,
                success: function (data) {
                    var $emailSignupMessage = $('.email-signup-message');

                    if ($emailSignupMessage.length === 0) {
                        $('body').append(
                            '<div class="email-signup-message dynamic-popup-form"></div>'
                        );
                    }

                    $emailSignupMessage
                        .css('transform', 'unset')
                        .append(
                            '<div class="email-signup-alert text-center ' +
                                data.messageType +
                                '">' +
                                data.msg +
                                '</div>'
                        );

                    $('.email-signup-alert').css({
                        margin: '-2% auto 0',
                        width: '350px',
                        top: '10%'
                    });
                    $('#dynamic-modal, #dynamic-modal-all').modal('hide');

                    setTimeout(function () {
                        $emailSignupMessage.remove();
                    }, 3000);

                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        }
    });
});
