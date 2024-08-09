$(document).ready(function () {
  let downloadInvoiceRenderElement = $("#download_EInvoice");
  let orderId = $(".modal-toggle-e-invoice").attr("data-order-id");
  let btnShowUrl = downloadInvoiceRenderElement.attr("data-btn-show");

  // Function to get label, placeholder, and options from attribute
  function getAttributeInfo(
    attribute,
    defaultLabel,
    defaultPlaceholder,
    optionsCount = 0
  ) {
    let info = downloadInvoiceRenderElement.attr(attribute)?.split(":") || [];
    return {
      label: info[0] || defaultLabel,
      placeholder: info[1] || defaultPlaceholder,
      options: info.slice(2, 2 + optionsCount),
    };
  }

  // BRN Info
  let { label: popupbRNInputLabel, placeholder: popupbRNInputPlaceHolder } =
    getAttributeInfo(
      "data-BRN",
      "Business Registration Number",
      "Enter Business Registration Number."
    );

  // NRIC Info
  let { label: popupNRICInputLabel, placeholder: popupNRICInputPlaceHolder } =
    getAttributeInfo("data-NRIC", "NRIC Number", "Enter NRIC Number.");

  // Passport Info
  let {
    label: popupPassportInputLabel,
    placeholder: popupPassportInputPlaceHolder,
  } = getAttributeInfo(
    "data-passport",
    "Passport Number",
    "Enter Passport Number."
  );

  // Army Info
  let { label: popuparmyInputLabel, placeholder: popuparmyInputPlaceHolder } =
    getAttributeInfo("data-army", "Army Number", "Enter Army Number.");

  let EInvoice = function () {
    let showAlert = function (data) {
      if (data.status) {
        if ($(".add-to-cart-messages").length === 0) {
          $("body").append('<div class="add-to-cart-messages"></div>');
        }
        $(".add-to-cart-messages").append(
          '<div class="alert alert-success add-to-basket-alert text-center text-left h-fw--semibold show"' +
            ' role="alert">' +
            data.successMsg +
            "</div>"
        );
        setTimeout(function () {
          $(".add-to-basket-alert").remove();
        }, 1500);
      } else {
        if ($(".add-to-cart-messages").length === 0) {
          $("body").append('<div class="add-to-cart-messages"></div>');
        }
        $(".add-to-cart-messages").append(
          '<div class="alert alert-danger add-to-basket-alert text-center text-left h-fw--semibold show"' +
            ' role="alert">' +
            data.errorMsg +
            "</div>"
        );
        setTimeout(function () {
          $(".add-to-basket-alert").remove();
        }, 1500);
      }
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

    this.submitForm = function (url, data, odrId) {
      var csrfToken = $('input[name="csrf_token"]').val();
      $.ajax({
        type: "POST",
        url: url + "?csrf_token=" + csrfToken,
        data: {
          orderID: odrId,
          tinNumber: data[1].value,
          identificationType: data[2].value,
          regNumber: data[3].value,
          sSTNumber: "NA",
        },
        success: function success(response) {
          showAlert(response);
          $("#submitEInvoiceDownloadForm")[0].reset()
        },
      });
    };
  };

  let eInvoice = new EInvoice();
  eInvoice.showEinvoiceButton(btnShowUrl, orderId);

  $("body").on("submit", "#submitEInvoiceDownloadForm", function (e) {
    e.preventDefault();
    
    eInvoice.submitForm($(this)[0].action, $(this).serializeArray(), orderId);
    $(".modal-e-invoice").toggleClass("is-visible");
  });

  // Quick & dirty toggle to demonstrate modal toggle behavior
  $("body").on("click", ".modal-toggle-e-invoice", function (e) {
    e.preventDefault();
    $(".modal-e-invoice").toggleClass("is-visible");
  });

  $("body").on("click", ".haveSst-js", function () {
    $(".haveSst-js").toggleClass("d-none");
    $(".haveSst-js-group").toggleClass("d-none");
  });

  $("body").on("change", "#identificationType", function () {
    var selectedValue = $(this).val();
    var bsnRegLabel = "";
    var bsnRegPlaceholder = "";
    var showfield = false;

    switch (selectedValue) {
      case "NRIC":
        bsnRegLabel = popupNRICInputLabel;
        bsnRegPlaceholder = popupNRICInputPlaceHolder;
        showfield = true;
        break;
      case "BRN":
        bsnRegLabel = popupbRNInputLabel;
        bsnRegPlaceholder = popupbRNInputPlaceHolder;
        showfield = true;
        break;
      case "PASSPORT":
        bsnRegLabel = popupPassportInputLabel;
        bsnRegPlaceholder = popupPassportInputPlaceHolder;
        showfield = true;
        break;
      case "ARMY":
        bsnRegLabel = popuparmyInputLabel;
        bsnRegPlaceholder = popuparmyInputPlaceHolder;
        showfield = true;
        break;
      default:
        bsnRegLabel = "";
        bsnRegPlaceholder = "";
        showfield = false;
    }

    let regFormTextArray = $("#form-regTB-error").text().split(" ");
    $("#form-regTB-error").text(
      bsnRegLabel +
        " " +
        regFormTextArray[regFormTextArray.length - 2] +
        " " +
        regFormTextArray[regFormTextArray.length - 1]
    );

    if (showfield) {
      $(".regNumber").removeClass("d-none");
    } else {
      $(".regNumber").addClass("d-none");
    }

    $("#regTB").attr("placeholder", bsnRegPlaceholder);
    $("#regTB").prev("label").text(bsnRegLabel);
  });
});
