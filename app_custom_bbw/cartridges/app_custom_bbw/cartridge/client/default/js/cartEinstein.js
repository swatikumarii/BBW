'use strict';

var confirmationEmailRecommendations = [];
var shipmentEmailRecommendations = [];
var deliveryEmailRecommendations = [];
var gcEmailRecommendations = [];

/**
 * updateEmailRecommendor
 */
function updateEmailRecommendor() {

    var confirmationEmailRecommendationPIDs = [];
    var shipmentEmailRecommendationPIDs = [];
    var deliveryEmailRecommendationPIDs = [];
    var gcEmailRecommendationPIDs = [];
    $('.confirmation-email-pids').each(function () {
        confirmationEmailRecommendationPIDs.push($(this).val());
    });
    $('.shipment-email-pids').each(function () {
        shipmentEmailRecommendationPIDs.push($(this).val());
    });
    $('.delivery-email-pids').each(function () {
        deliveryEmailRecommendationPIDs.push($(this).val());
    });
    $('.gc-email-pids').each(function () {
        gcEmailRecommendationPIDs.push($(this).val());
    });
    var setEmailRecommendationsURL = $(
        'input[name="email-recommendations-url"'
    ).val();
    if (
        setEmailRecommendationsURL &&
        (confirmationEmailRecommendationPIDs.length > 0 ||
            gcEmailRecommendationPIDs.length > 0) &&
        (confirmationEmailRecommendations.length !== confirmationEmailRecommendationPIDs.length ||
            shipmentEmailRecommendations.length !== shipmentEmailRecommendationPIDs.length ||
            deliveryEmailRecommendations.length !== deliveryEmailRecommendationPIDs.length ||
            gcEmailRecommendations.length !== gcEmailRecommendationPIDs.length)
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
                    deliveryEmailRecommendationPIDs.toString(),
                gcEmailRecommendationPIDs: gcEmailRecommendationPIDs.toString()
            }
        });
    }
    confirmationEmailRecommendations = confirmationEmailRecommendationPIDs;
    shipmentEmailRecommendations = shipmentEmailRecommendationPIDs;
    deliveryEmailRecommendations = deliveryEmailRecommendationPIDs;
    gcEmailRecommendations = gcEmailRecommendationPIDs;
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
