'use strict';

var confirmationEmailRecommendations = [];
var shipmentEmailRecommendations = [];
var deliveryEmailRecommendations = [];

/**
 * updateEmailRecommendor
 */
function updateEmailRecommendor() {

    var confirmationEmailRecommendationPIDs = [];
    var shipmentEmailRecommendationPIDs = [];
    var deliveryEmailRecommendationPIDs = [];
    $('.confirmation-email-pids').each(function () {
        confirmationEmailRecommendationPIDs.push($(this).val());
    });
    $('.shipment-email-pids').each(function () {
        shipmentEmailRecommendationPIDs.push($(this).val());
    });
    $('.delivery-email-pids').each(function () {
        deliveryEmailRecommendationPIDs.push($(this).val());
    });
    var setEmailRecommendationsURL = $(
        'input[name="email-recommendations-url"'
    ).val();
    if (
        setEmailRecommendationsURL &&
        confirmationEmailRecommendationPIDs.length > 0 &&
        (confirmationEmailRecommendations.length !== confirmationEmailRecommendationPIDs.length ||
        shipmentEmailRecommendations.length !== shipmentEmailRecommendationPIDs.length ||
        deliveryEmailRecommendations.length !== deliveryEmailRecommendationPIDs.length)
    ) {
        $.ajax({
            url: setEmailRecommendationsURL,
            type: 'post',
            data: {
                confirmationEmailRecommendationPIDs:
                    confirmationEmailRecommendationPIDs.toString(),
                shipmentEmailRecommendationPIDs:
                    shipmentEmailRecommendationPIDs.toString(),
                deliveryEmailRecommendationPIDs:
                    deliveryEmailRecommendationPIDs.toString()
            }
        });
    }
    confirmationEmailRecommendations = confirmationEmailRecommendationPIDs;
    shipmentEmailRecommendations = shipmentEmailRecommendationPIDs;
    deliveryEmailRecommendations = deliveryEmailRecommendationPIDs;;
}

$(document).ready(function () {

    var targetElement = document.getElementById('maincontent');
    var observerRec = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            var mutationId = $(mutation.target).attr('id');
            if (
                $(mutation.target).find('[id^="cq_recomm_slot-"]').length > 0 ||
                (mutationId &&
                    mutationId !== 'undefined' &&
                    mutationId.includes('cq_recomm_slot-'))
            ) {
                updateEmailRecommendor();
            }
        });
    });

    var config = {
        childList: true,
        subtree: true
    };

    observerRec.observe(targetElement, config);

});
