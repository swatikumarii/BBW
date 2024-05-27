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

/**
 * On ready
 */
$(document).ready(function () {
    initMap();
    var now = new Date(); // get the current day of the week 
    var daysOfWeek = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
    var dayOfWeek = daysOfWeek[now.getDay()];
    var todaysOpeningTime = $(`li:contains(` + dayOfWeek + `)`).children('.sl-time').text();
    if(todaysOpeningTime){
        var arr = todaysOpeningTime.split(/\s*\-\s*/g);
        var currTime = now.getHours();
        //break time to get open hour
        var exactOpenHr = (arr[0].toLowerCase()).includes('am')
            ? Number(arr[0].split(/\s*\:\s*/g)[0])
            : Number(arr[0].split(/\s*\:\s*/g)[0]) + 12; ;      
        
        var exactClosingHr = (arr[1].toLowerCase()).includes('am') ? Number((arr[1].split(/\s*\:\s*/g))[0]) : Number((arr[1].split(/\s*\:\s*/g))[0]) + 12;
        if(exactOpenHr > currTime){
            $('.closed').removeClass('d-none');
        }
        if (currTime >= exactOpenHr) {
            $('.closed').addClass('d-none');
            $('.opened').removeClass('d-none');
            $('#open-now').append(arr[1]);
        }
        if(currTime > exactClosingHr){
            $('.closed').removeClass('d-none');
            $('.opened').addClass('d-none'); 
        }
    }

});
