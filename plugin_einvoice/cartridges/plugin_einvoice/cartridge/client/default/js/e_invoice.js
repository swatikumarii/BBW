$(document).ready(function () {
    let downloadInvoiceRenderElement = $('#download_EInvoice');
    //let orderId = $('.modal-toggle-e-invoice').attr('data-order-id');
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
                return true;
            } else {
                $.spinner().stop();
                $('.invalid-submittion').html(data.errorMsg);
                $('.invalid-submittion').show();
                return false;
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

        this.checkStatus = function (
            url,
            odrId,
            showToggle,
            showPendingMessage
        ) {
            let eInvoiceBtnElement = $('body').find(
                '.modal-toggle-e-invoice[data-order-id=' + odrId + ']'
            );
            eInvoiceBtnElement.spinner().start();
            $('#submitEInvoiceDownloadForm')[0].reset();
            $('.invalid-submittion').html('');
            $('#identificationType').trigger('change');
            var csrfToken = $('input[name="csrf_token"]').val();
            $.ajax({
                type: 'GET',
                url: url + '?orderId=' + odrId + '&csrf_token=' + csrfToken,
                success: function success(response) {
                     var pendingDetailsElement = $('body').find(
                         '.e-invoice-pending-details[data-id=' + odrId + ']'
                     );
                     var errorDetailsElement = $('body').find(
                         '.e-invoice-error-details[data-id=' + odrId + ']'
                     );
                    if (response.status === 'pending') {
                        showPendingMessage = false;
                        if (showPendingMessage) {
                            showAlertHtml(response.message);
                        }

                        var classes = eInvoiceBtnElement.attr('class');
                        var parentElement = eInvoiceBtnElement
                            .parent()
                            .find('.e-invoice-pending-details');
                        eInvoiceBtnElement.spinner().stop();
                        $('.modal-e-invoice').attr('style', '');
                        var btnHtml =
                            '<button class="' +
                            classes +
                            ' einvoice-a-2-btn' +
                            '" target="_blank" data-order-id="' +
                            odrId +
                            '">' +
                            response.btnText +
                            '</button>';
                        if (parentElement.length > 0) {
                            eInvoiceBtnElement.remove();
                            parentElement.before(btnHtml);
                        } else {
                            var outsideParentElement =
                                eInvoiceBtnElement.parent();
                            eInvoiceBtnElement.remove();
                            outsideParentElement.append(btnHtml);
                        }
                        eInvoiceBtnElement.removeClass(
                            'modal-toggle-e-invoice'
                        );
                        //to-do
                        errorDetailsElement.remove();
                         $('body')
                             .find(
                                 '.einvoice-a-2-btn[data-order-id=' +
                                     odrId +
                                     ']'
                             )
                             .prop('disabled', true);
                        pendingDetailsElement.removeClass('d-none');
                        pendingDetailsElement.show();
                    } else if (response.status === 'success') {
                        var classes = eInvoiceBtnElement.attr('class');
                        var parentElement = eInvoiceBtnElement.parent();
                        eInvoiceBtnElement.spinner().stop();
                        $('.modal-e-invoice').attr('style', '');
                        eInvoiceBtnElement.remove();
                        parentElement.append(
                            '<button data-url="' +
                                response.qrCodeLink +
                                '" class="' +
                                classes +
                                ' einvoice-a-2-btn' +
                                '" target="_blank" data-order-id="' +
                                odrId +
                                '">' +
                                response.btnText +
                                '</button>'
                        );
                        //to-do
                        errorDetailsElement.remove();
                        eInvoiceBtnElement.removeClass(
                            'modal-toggle-e-invoice'
                        );
                        pendingDetailsElement.hide();
                    } else {
                        var classes = eInvoiceBtnElement.attr('class');
                        var parentElement = eInvoiceBtnElement.parent();
                        eInvoiceBtnElement.spinner().stop();
                        $('.modal-e-invoice').attr('style', '');
                        if (showToggle) {
                            $('.modal-e-invoice').toggleClass('is-visible');
                            $('body').toggleClass('einvoice-open');
                        }
                        //to-do
                        pendingDetailsElement.hide();
                        if (response.customerTaxNumber.length > 0){
                            $('#tinTB').val(response.customerTaxNumber);
                        }
                        else{
                            $('#tinTB').val("");
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
                    orderID: data[0].value,
                    tinNumber: data[1].value,
                    identificationType: data[2].value,
                    regNumber: data[3].value,
                    sSTNumber: 'NA'
                },
                success: function success(response) {
                    var showAlertResponse = showAlert(response);
                    if (showAlertResponse) {
                        self.checkStatus(
                            statusCheckUrl,
                            data[0].value,
                            false,
                            false
                        );
                        $('body').removeClass('einvoice-open');
                    } else {
                        return false;
                    }
                }
            });
        };
    };

    let eInvoice = new EInvoice();

    //to-do
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
            eInvoice.submitForm($(this)[0].action, formData, null);
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
    //to-do
    $('body').on('click', '.modal-toggle-e-invoice', function (e) {
        e.preventDefault();
        var orderId = $(this).attr('data-order-id');
        $('#submitEInvoiceDownloadForm')
            .find('input[name=orderId]')
            .val(orderId);
        eInvoice.checkStatus(statusCheckUrl, orderId, true, true);
    });

    $('body').on('click', '.modal-close-e-invoice', function () {
        $('#submitEInvoiceDownloadForm')[0].reset();
        $('.invalid-submittion').html('');
        $('#identificationType').trigger('change');
        $('.modal-e-invoice').toggleClass('is-visible');
        $('#submitEInvoiceDownloadForm')
            .find('input[name=orderId]')
            .val("");
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
