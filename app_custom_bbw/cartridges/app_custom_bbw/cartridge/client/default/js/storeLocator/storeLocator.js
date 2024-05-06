'use strict';

var baseStore = require('base/storeLocator/storeLocator');


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

    // Customized google map marker icon with svg format
    var markerImg = {
        path: 'M13.5,30.1460153 L16.8554555,25.5 L20.0024287,25.5 C23.039087,25.5 25.5,'
            + '23.0388955 25.5,20.0024287 L25.5,5.99757128 C25.5,2.96091298 23.0388955,0.5 '
            + '20.0024287,0.5 L5.99757128,0.5 C2.96091298,0.5 0.5,2.96110446 0.5,5.99757128 '
            + 'L0.5,20.0024287 C0.5,23.039087 2.96110446,25.5 5.99757128,25.5 L10.1445445,'
            + '25.5 L13.5,30.1460153 Z',
        fillColor: '#0070d2',
        fillOpacity: 1,
        scale: 1.1,
        strokeColor: 'white',
        strokeWeight: 1,
        anchor: new google.maps.Point(13, 30),
        labelOrigin: new google.maps.Point(12, 12)
    };

    Object.keys(mapdiv).forEach(function (key) {
        var item = mapdiv[key];
        var lable = parseInt(key, 10) + 1;
        var storeLocation = new google.maps.LatLng(item.latitude, item.longitude);
        var marker = new google.maps.Marker({
            position: storeLocation,
            map: map,
            title: item.name,
            icon: markerImg,
            label: { text: lable.toString(), color: 'white', fontSize: '16px' }
        });

        marker.addListener('click', function () {
            infowindow.setOptions({
                content: item.infoWindowHtml
            });
            infowindow.open(map, marker);
        });

        // Create a minimum bound based on a set of storeLocations
        bounds.extend(marker.position);
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
    } else {
        $('.store-locator-no-results').addClass('d-none');
        $('#no-stores-result').hide();
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
        }
    });
}

/**
 * Search for stores with new zip code
 * @param {HTMLElement} element - the target html element
 */
function search(element) {
    var dialog = element.closest('.in-store-inventory-dialog');
    var spinner = dialog.length ? dialog.spinner() : $.spinner();
    spinner.start();
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
            geocoder.geocode({ address: postalCodeVal }).then(function (response) {
                if (response.results[0]) {
                    var location = response.results[0].geometry.location;
                    var addressComponents = response.results[0].address_components;
                    var countryCode='';
                    for (var i = 0; i < addressComponents.length; i++) {
                        if (addressComponents[i].types[0] === 'country') {
                            countryCode = addressComponents[i].short_name;
                        }
                    }
                    var lat = location.lat();
                    var long = location.lng();
                    var payload ='';
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
                            ? $form.serialize() + '&countryCode=' + countryCode
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
