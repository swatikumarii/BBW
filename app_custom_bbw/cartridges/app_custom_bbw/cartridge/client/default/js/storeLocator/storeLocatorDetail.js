/* eslint-disable */
'use strict';

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
