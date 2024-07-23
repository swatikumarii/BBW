'use strict';

$(document).ready(function () {
    var confirmationEmailRecommendationPIDs = [];
    var shipmentEmailRecommendationPIDs = [];
    var deliveryEmailRecommendationPIDs = [];
    $('.confirmation-email-pids').each( function () {
        confirmationEmailRecommendationPIDs.push($(this).val());
    });
    $('.shipment-email-pids').each( function () {
        shipmentEmailRecommendationPIDs.push($(this).val());
    });
    $('.delivery-email-pids').each( function () {
        deliveryEmailRecommendationPIDs.push($(this).val());
    });
    var setEmailRecommendationsURL = $('input[name="email-recommendations-url"').val();
    if (setEmailRecommendationsURL && confirmationEmailRecommendationPIDs.length > 0) {
        $.ajax({
            url: setEmailRecommendationsURL,
            type: 'post',
            data: {
                confirmationEmailRecommendationPIDs: confirmationEmailRecommendationPIDs.toString(),
                shipmentEmailRecommendationPIDs: shipmentEmailRecommendationPIDs.toString(),
                deliveryEmailRecommendationPIDs: deliveryEmailRecommendationPIDs.toString()
            }
        });
    }
});
