'use strict';

var baseStore = require('base/storeLocator/storeLocator');

/**
 * @returns {boolean} True is valid else False
 */
function validatePostalCode() {
    var postalCodeInput = $('#store-postal-code');
    if (!postalCodeInput.val()) {
        postalCodeInput.addClass('is-invalid'); // Add class for input border error
        var errorMsg = postalCodeInput.data('missing-error');
        $('#store-postal-code-error').text(errorMsg);
        return false;
    }
    postalCodeInput.removeClass('is-invalid'); // Remove class if input is valid
    return true;
}

/**
 * Uses google maps api to render a map
 */
function maps() {
    var map;
    var infowindow = new google.maps.InfoWindow();
    // Init U.S. Map in the center of the viewport
    var geolocationDiv = $('#geolocation-data');
    var latlng = {
        lat: geolocationDiv.data('lat'),
        lng: geolocationDiv.data('long')
    };
    latlng = new google.maps.LatLng(latlng.lat, latlng.lng);
    var mapOptions = {
        scrollwheel: false,
        zoom: 4,
        center: latlng
    };
    map = new google.maps.Map($('.map-canvas')[0], mapOptions);
    var mapdiv = $('.map-canvas').attr('data-locations');
    mapdiv = JSON.parse(mapdiv);
    var bounds = new google.maps.LatLngBounds();
    var imageUrlBlack = $('#marker-images-url').data('black-marker');
    imageUrlBlack = {
        url: imageUrlBlack,
        labelOrigin: {
            x: 15,
            y: 15
        }
    };

    var imageUrlPink = $('#marker-images-url').data('pink-marker');
    imageUrlPink = {
        url: imageUrlPink,
        labelOrigin: {
            x: 15,
            y: 15
        }
    };
    var markers=[];
    var contents=[];

    Object.keys(mapdiv).forEach(function (key) {
        var item = mapdiv[key];
        var lable = parseInt(key, 10) + 1;
        var storeLocation = new google.maps.LatLng(
            item.latitude,
            item.longitude
        );
        var marker = new google.maps.Marker({
            position: storeLocation,
            map: map,
            title: item.name,
            icon: imageUrlBlack,
            label: { text: lable.toString(), color: 'black', fontSize: '16px' }
        });
        contents.push(item);
        markers.push(marker);
        // Create a minimum bound based on a set of storeLocations
        bounds.extend(marker.position);
    });
    markers.forEach(function (element, index) {
        if(index===0){
            map.setCenter(markers[index].position);
            infowindow.setOptions({
                content: contents[index].infoWindowHtml
            });
            infowindow.open(map, markers[index]);
            markers[index].setIcon(imageUrlPink);
        }
        element.addListener('click', function () {
            map.setCenter(element.position);
            infowindow.setOptions({
                content: contents[index].infoWindowHtml
            });
            infowindow.open(map, element);
            markers.forEach(function (ele){
                ele.setIcon(imageUrlBlack);
            });
            element.setIcon(imageUrlPink);
        });
    });
    // Fit the all the store marks in the center of a minimum bounds when any store has been found.
    if (mapdiv && mapdiv.length !== 0) {
        map.fitBounds(bounds);
    }
}

/**
 * Renders the results of the search and updates the map
 * @param {object} data - Response from the server
 */
function updateStoresResults(data) {
    var $resultsDiv = $('.results');
    var $mapDiv = $('.map-canvas');
    var hasResults = data.stores.length > 0;

    if (!hasResults) {
        $('.store-locator-no-results').removeClass('d-none');
        $('#no-stores-result').show();
        $('.number-of-stores-div').addClass('d-none');
    } else {
        $('.store-locator-no-results').addClass('d-none');
        $('#no-stores-result').hide();
        $('.number-of-stores-div').removeClass('d-none');
        $('#number-of-stores').text(data.stores.length);
    }

    $resultsDiv.empty()
        .data('has-results', hasResults)
        .data('radius', data.radius)
        .data('search-key', data.searchKey);

    $mapDiv.attr('data-locations', data.locations);

    if ($mapDiv.data('has-google-api')) {
        maps();
    } else {
        $('.store-locator-no-api-key').show();
    }

    if (data.storesResultsHtml) {
        $resultsDiv.append(data.storesResultsHtml);
    }
}

/**
 * Ajax call to submit request
 * @param {string} method - method type of the call
 * @param {string} url - url to be called
 * @param {object} payload - payload in body
 */
function submitSearch(method, url, payload){
    $.ajax({
        url: url,
        type: method,
        data: payload,
        dataType: 'json',
        success: function (data) {
            updateStoresResults(data);
            $('.select-store').prop('disabled', true);
            $('.results-store-name').click(function () {
                // make accordian click and triger click on pin marker
                var title = $(this).attr('data-store-title');
                var a = $('div[title="' + title + '"]');
                a.trigger('click');
            });
            var accordianDiv = $('#' + data.stores[0].ID);

            $('body,html').animate(
                {
                    scrollTop: accordianDiv.offset().top - 250
                },
                500
            );
        }
    });
}

/**
 * Search for stores with new zip code
 * @param {HTMLElement} element - the target html element
 */
function search(element) {         
    var $form = element.closest('.store-locator');
    var url = $form.attr('action');
    var postalCodeVal = $form.find('[name="postalCode"]').val();
    var isNumber = Boolean(Number(postalCodeVal));
    var method = $form.attr('method');
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: postalCodeVal }).then(function (response) {
        if (response.results[0]) {
            var location = response.results[0].geometry.location;
            var addressComponents = response.results[0].address_components;
            var countryCode='';
            for(var i=0; i<addressComponents.length; i++){
                if(addressComponents[i].types[0] === 'country'){
                    countryCode = addressComponents[i].short_name;
                }
            }
            var lat = location.lat();
            var long = location.lng();
            var payload = '';
            if(!isNumber){
                payload = $form.is('form') ? $form.serialize() + '&latitude=' + lat + '&longitude=' + long + '&countryCode=' + countryCode : { postalCode: postalCodeVal };
                submitSearch(method, url, payload);
            }
            else{
                payload = $form.is('form') ? $form.serialize() + '&countryCode=' + countryCode : { postalCode: postalCodeVal };
                submitSearch(method, url, payload);
            }
            return true;
        }
        return false;
    });
}

module.exports = $.extend({}, baseStore, {
    init: function () {
        if ($('.map-canvas').data('has-google-api')) {
            maps();
        } else {
            $('.store-locator-no-api-key').show();
        }
    },
    search: function () {
        $('.store-locator-container form.store-locator').submit(function (e) {
            e.preventDefault();
            search($(this));
        });
        $(
            '.store-locator-container .btn-storelocator-search[type="button"]'
        ).click(function (e) {
            e.preventDefault();
            search($(this));
        });
    },

    changeRadius: function () {
        $('.store-locator-container .radius').change(function () {
            var element = $('.store-locator-container form.store-locator');
            var $form = element.closest('.store-locator');
            var url = $form.attr('action');
            var postalCodeVal = $form.find('[name="postalCode"]').val();
            var isNumber = Boolean(Number(postalCodeVal));
            var method = $form.attr('method');
            var geocoder = new google.maps.Geocoder();
            geocoder
                .geocode({ address: postalCodeVal })
                .then(function (response) {
                    if (response.results[0]) {
                        var location = response.results[0].geometry.location;
                        var addressComponents =
                            response.results[0].address_components;
                        var countryCode = '';
                        for (var i = 0; i < addressComponents.length; i++) {
                            if (addressComponents[i].types[0] === 'country') {
                                countryCode = addressComponents[i].short_name;
                            }
                        }
                        var lat = location.lat();
                        var long = location.lng();
                        var payload = '';
                        if (!isNumber) {
                            payload = $form.is('form')
                                ? $form.serialize() +
                                  '&latitude=' +
                                  lat +
                                  '&longitude=' +
                                  long +
                                  '&countryCode=' +
                                  countryCode
                                : { postalCode: postalCodeVal };
                            submitSearch(method, url, payload);
                        } else {
                            payload = $form.is('form')
                                ? $form.serialize() +
                                  '&countryCode=' +
                                  countryCode
                                : { postalCode: postalCodeVal };
                            submitSearch(method, url, payload);
                        }
                        return true;
                    }
                    return false;
                });
        });
    }
});

/** Map and list view in responsive */
$('.map-view').click(function () {
    $(this).addClass('active');
    $('.list-view').removeClass('active');
    $('.map-canvas').removeClass('d-none');
});

$('.list-view').click(function () {
    $(this).addClass('active');
    $('.map-view').removeClass('active');
    $('.map-canvas').addClass('d-none');
});

/**
 * Set city field with user current city
 */
function geolocation(){
    var geolocationDiv = $('#geolocation-data');
    var latlng = {
        lat: geolocationDiv.data('lat'),
        lng: geolocationDiv.data('long')
    };
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: latlng }).then(function (response) {
        if (response.results[0]) {
            var addressComponents = response.results[0].address_components;
            for (var i = 0; i < addressComponents.length; i++) {
                if (
                    addressComponents[i].types[0] === 'locality' ||
                    addressComponents[i].types[1] === 'locality'
                ) {
                    var city = addressComponents[i].long_name;
                    $('#store-postal-code').val(city);
                }
            }
        }
    });
}
geolocation();

/**
 * On ready
 */
$(document).ready(function () {

    $(document).on('blur', '#store-postal-code', function () {
        validatePostalCode();
    });

});
