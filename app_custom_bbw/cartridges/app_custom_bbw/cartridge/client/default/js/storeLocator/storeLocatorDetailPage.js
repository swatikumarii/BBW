'use strict'

/**
 * initialises google map
 */
function initMap(){
    var mapDiv = $('.map-canvas');
    var lat = mapDiv.data('latitude');
    var long = mapDiv.data('longitude');
    var Map = google.maps.importLibrary('maps');
    var AdvancedMarkerElement = google.maps.importLibrary('marker');
    var latlong = {lat:lat, lng:long};
    var mapElement = document.getElementById('mapfordetail');
    var MapObj = {center: latlong, zoom: 8, mapId: 'bbw-google-map-for-store'};
    var map = Map(mapElement, MapObj);
    var markerDetail = {position:latlong};
    AdvancedMarkerElement(map,markerDetail);
};
initMap();
