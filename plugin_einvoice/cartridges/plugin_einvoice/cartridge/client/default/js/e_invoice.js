$(document).ready(function () {
    var formValidation = require('base/components/formValidation');
    let downloadInvoiceRenderElement = $('#download_EInvoice');
    let orderId = $('.modal-toggle-e-invoice').attr('data-order-id');
    let btnShowUrl = downloadInvoiceRenderElement.attr('data-btn-show');
    let statusCheckUrl = downloadInvoiceRenderElement.attr('data-check-status');
    let NRICHintText = $('.NRICHintText');

    // Function to get label, placeholder, and options from attribute
    function getAttributeInfo(
        attribute,
        defaultLabel,
        defaultPlaceholder,
        optionsCount = 0
    ) {
        let info =
            downloadInvoiceRenderElement.attr(attribute)?.split(':') || [];
        return {
            label: info[0] || defaultLabel,
            placeholder: info[1] || defaultPlaceholder,
            options: info.slice(2, 2 + optionsCount)
        };
    }

    // BRN Info
    let { label: popupbRNInputLabel, placeholder: popupbRNInputPlaceHolder } =
        getAttributeInfo(
            'data-BRN',
            'Business Registration Number',
            'Enter Business Registration Number.'
        );

    // NRIC Info
    let { label: popupNRICInputLabel, placeholder: popupNRICInputPlaceHolder } =
        getAttributeInfo('data-NRIC', 'NRIC Number', 'Enter NRIC Number.');

    // Passport Info
    let {
        label: popupPassportInputLabel,
        placeholder: popupPassportInputPlaceHolder
    } = getAttributeInfo(
        'data-passport',
        'Passport Number',
        'Enter Passport Number.'
    );

    // Army Info
    let { label: popuparmyInputLabel, placeholder: popuparmyInputPlaceHolder } =
        getAttributeInfo('data-army', 'Army Number', 'Enter Army Number.');

    let EInvoice = function () {
        let showAlert = function (data) {
            if (data.status) {
                $('.modal-e-invoice').toggleClass('is-visible');
                $('#submitEInvoiceDownloadForm')[0].reset();
                $('.invalid-submittion').html('');
                $.spinner().stop();
                showAlertHtml(data.successMsg);
            } else {
                $.spinner().stop();
                $('.invalid-submittion').html(data.errorMsg);
            }
        };

        let showAlertHtml = function (message) {
            if ($('.add-to-cart-messages').length === 0) {
                $('body').append('<div class="add-to-cart-messages"></div>');
            }
            $('.add-to-cart-messages').append(
                '<div class="alert alert-success add-to-basket-alert text-center text-left h-fw--semibold show"' +
                    ' role="alert" style="width:720px">' +
                    message +
                    '</div>'
            );
            setTimeout(function () {
                $('.add-to-basket-alert').remove();
            }, 5000);
        };

        this.showEinvoiceButton = function (url, odrId) {
            var csrfToken = $('input[name="csrf_token"]').val();
            $.ajax({
                type: 'GET',
                url: url + '?orderId=' + odrId + '&csrf_token=' + csrfToken,
                success: function success(response) {
                    if (response.isValid) {
                        $('.modal-toggle-e-invoice').show();
                    } else {
                        $('.modal-toggle-e-invoice').hide();
                    }
                }
            });
        };

        this.checkStatus = function (
            url,
            odrId,
            showToggle,
            showPendingMessage
        ) {
            $('.modal-toggle-e-invoice').spinner().start();
            $('#submitEInvoiceDownloadForm')[0].reset();
            $('.invalid-submittion').html('');
            $('#identificationType').trigger('change');
            var csrfToken = $('input[name="csrf_token"]').val();
            $.ajax({
                type: 'GET',
                url: url + '?orderId=' + odrId + '&csrf_token=' + csrfToken,
                success: function success(response) {
                    if (response.status === 'pending') {
                        showPendingMessage = false;
                        if (showPendingMessage) {
                            showAlertHtml(response.message);
                        }

                        var classes = $('.modal-toggle-e-invoice').attr(
                            'class'
                        );
                        var parentElement = $(
                            '.modal-toggle-e-invoice'
                        ).parent();
                        $('.modal-toggle-e-invoice').spinner().stop();
                        $('.modal-e-invoice').attr('style', '');
                        $('.modal-toggle-e-invoice').remove();
                        parentElement.append(
                            '<button class="' +
                                classes +
                                ' einvoice-a-2-btn' +
                                '" target="_blank">' +
                                response.btnText +
                                '</button>'
                        );
                        $('.modal-toggle-e-invoice').removeClass(
                            'modal-toggle-e-invoice'
                        );
                         $('.e-invoice-error-details').remove();
                        $('.einvoice-a-2-btn').prop("disabled",true)
                    } else if (response.status === 'success') {
                        var classes = $('.modal-toggle-e-invoice').attr(
                            'class'
                        );
                        var parentElement = $(
                            '.modal-toggle-e-invoice'
                        ).parent();
                        $('.modal-toggle-e-invoice').spinner().stop();
                        $('.modal-e-invoice').attr('style', '');
                        $('.modal-toggle-e-invoice').remove();
                        parentElement.append(
                            '<button data-url="' +
                                response.qrCodeLink +
                                '" class="' +
                                classes +
                                ' einvoice-a-2-btn' +
                                '" target="_blank">' +
                                response.btnText +
                                '</button>'
                        );
                         $('.e-invoice-error-details').remove();
                        $('.modal-toggle-e-invoice').removeClass(
                            'modal-toggle-e-invoice'
                        );
                    } else {
                        var classes = $('.modal-toggle-e-invoice').attr(
                            'class'
                        );
                        var parentElement = $(
                            '.modal-toggle-e-invoice'
                        ).parent();
                        $('.modal-toggle-e-invoice').spinner().stop();
                        $('.modal-e-invoice').attr('style', '');                       
                        if (showToggle) {
                            $('.modal-e-invoice').toggleClass('is-visible');
                            $('body').toggleClass('einvoice-open');
                        }
                    }
                }
            });
        };

        var self = this;

        this.submitForm = function (url, data, odrId) {
            var csrfToken = $('input[name="csrf_token"]').val();
            $.ajax({
                type: 'POST',
                url: url + '?csrf_token=' + csrfToken,
                data: {
                    orderID: odrId,
                    tinNumber: data[1].value,
                    identificationType: data[2].value,
                    regNumber: data[3].value,
                    sSTNumber: 'NA'
                },
                success: function success(response) {
                    showAlert(response);
                    self.checkStatus(statusCheckUrl, orderId, false, false);
                }
            });
        };
    };

    let eInvoice = new EInvoice();
    eInvoice.showEinvoiceButton(btnShowUrl, orderId);    

    $('body').on('submit', '#submitEInvoiceDownloadForm', function (e) {
        e.preventDefault();
        $.spinner().start();

        var formData = $(this).serializeArray();

        var isFieldValid = true;
        var regex = /^[a-zA-Z0-9]{6}-[a-zA-Z0-9]{2}-[a-zA-Z0-9]{4}$/;

        if (formData[2].value == 'NRIC') {
            if (!regex.test(formData[3].value)) {
                isFieldValid = false;
            } else {
                formData[3].value = formData[3].value.replaceAll('-', '');
            }
        }

        var regType = $('#regTB').prev('label').text().split(' ');
        regType[regType.length - 1] = regType[regType.length - 1].toLowerCase();
        regType = regType.join(' ');

        if (isFieldValid) {
            $('.invalid-submittion').hide();
            $('.invalid-submittion').text('');
            eInvoice.submitForm($(this)[0].action, formData, orderId);
        } else {
            $('.invalid-submittion').text('The ' + regType + ' is not valid.');
            $('.invalid-submittion').show();
            $.spinner().stop();
        }
    });

    $('body').on('click', '.einvoice-a-2-btn', function () {
        if ($(this).attr('data-url')) {
             window.open($(this).attr('data-url'), '_blank');
        }       
    });

    // Quick & dirty toggle to demonstrate modal toggle behavior
    $('body').on('click', '.modal-toggle-e-invoice', function (e) {
        e.preventDefault();
        eInvoice.checkStatus(statusCheckUrl, orderId, true, true);
    });

    $('body').on('click', '.modal-close-e-invoice', function () {
        $('#submitEInvoiceDownloadForm')[0].reset();
        $('.invalid-submittion').html('');
        $('#identificationType').trigger('change');
        $('.modal-e-invoice').toggleClass('is-visible');
        $('body').toggleClass('einvoice-open');
    });

    $('body').on('click', '.haveSst-js', function () {
        $('.haveSst-js').toggleClass('d-none');
        $('.haveSst-js-group').toggleClass('d-none');
    });

    $('body').on('change', '#identificationType', function () {
        var selectedValue = $(this).val();
        var bsnRegLabel = '';
        var bsnRegPlaceholder = '';
        var showfield = false;

        switch (selectedValue) {
            case 'NRIC':
                var NRICNumberJson = popupNRICInputLabel.split(' ');
                bsnRegLabel = popupNRICInputLabel;
                bsnRegPlaceholder = popupNRICInputPlaceHolder;
                showfield = true;
                NRICHintText.html(
                    NRICNumberJson[0] +
                        ' ' +
                        NRICNumberJson[1].toLowerCase() +
                        ' ex:- YYMMDD-PB-###G'
                );
                break;
            case 'BRN':
                bsnRegLabel = popupbRNInputLabel;
                bsnRegPlaceholder = popupbRNInputPlaceHolder;
                showfield = true;
                NRICHintText.html('');
                break;
            case 'PASSPORT':
                bsnRegLabel = popupPassportInputLabel;
                bsnRegPlaceholder = popupPassportInputPlaceHolder;
                showfield = true;
                NRICHintText.html('');
                break;
            case 'ARMY':
                bsnRegLabel = popuparmyInputLabel;
                bsnRegPlaceholder = popuparmyInputPlaceHolder;
                showfield = true;
                NRICHintText.html('');
                break;
            default:
                bsnRegLabel = '';
                bsnRegPlaceholder = '';
                showfield = false;
                NRICHintText.html('');
        }

        // let regFormTextArray = $('#form-regTB-error').text().split(' ');
        // $('#form-regTB-error').text(
        //     bsnRegLabel +
        //         ' ' +
        //         regFormTextArray[regFormTextArray.length - 2] +
        //         ' ' +
        //         regFormTextArray[regFormTextArray.length - 1]
        // );

        if (showfield) {
            $('.regNumber').removeClass('d-none');
        } else {
            $('.regNumber').addClass('d-none');
        }

        $('#regTB').attr('placeholder', bsnRegPlaceholder);
        $('#regTB').prev('label').text(bsnRegLabel);
    });
});
