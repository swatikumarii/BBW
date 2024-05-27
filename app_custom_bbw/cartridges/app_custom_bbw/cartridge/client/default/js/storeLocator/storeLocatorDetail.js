/* eslint-disable */
'use strict';

/* Header my account dropdown */
$('.store-dropdown').on('click', function (e) {
    if ($(this).find('.dropdown-menu').hasClass('show')) {
        $(this).find('.dropdown-menu').removeClass('show');
        $(this).find('.dropdown-toggle').removeClass('in');
    } else {
        $(this).find('.dropdown-menu').addClass('show');
        $(this).find('.dropdown-toggle').addClass('in');
    }
    e.stopPropagation();
});

/** Close header account dropdown on body click */
$('body').on('click', function () {
    var storeDropdownMenu = $('.store-dropdown').find('.dropdown-menu');
    if (storeDropdownMenu && storeDropdownMenu.hasClass('show')) {
        storeDropdownMenu.removeClass('show');
    }
    var storeDropdownToggle = $('.store-dropdown').find('.dropdown-toggle');
    if (storeDropdownToggle && storeDropdownToggle.hasClass('in')) {
        storeDropdownToggle.removeClass('in');
    }
});

async function initMap() {
    // The location of Uluru
    var mapDiv = $('.map-canvas');
    var lat = mapDiv.data('latitude');
    var long = mapDiv.data('longitude');
    var position = { lat: lat, lng: long };
    // Request needed libraries.
    //@ts-ignore
    var { Map } = await google.maps.importLibrary('maps');
    var { AdvancedMarkerElement } = await google.maps.importLibrary('marker');

    // The map, centered at Uluru
    var map = new Map(document.getElementById('mapfordetail'), {
        zoom: 8,
        center: position,
        mapId: 'DEMO_MAP_ID'
    });

    // The marker, positioned at Uluru
    var marker = new AdvancedMarkerElement({
        map: map,
        position: position
    });
}

initMap();
