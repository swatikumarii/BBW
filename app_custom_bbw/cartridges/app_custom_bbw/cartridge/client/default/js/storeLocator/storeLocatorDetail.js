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

/**
 * On ready
 */
$(document).ready(function () {
    initMap();
    var timeZone = $('#store-hours-details').attr('data-timezone')
    var now = new Date().toLocaleString("en-US", {timeZone: timeZone});// get the current day of the week 
    var currday = new Date().toLocaleString('en-US', {
        weekday: 'short',
        timeZone: timeZone
    });
    var nowTime = now.split(/\s*\,\s*/g)[1];
    var currentHr = (nowTime.toLowerCase()).includes('am') ? (((Number(nowTime.split(/\s*\:\s*/g)[0])) == 12 ? 0 : Number(nowTime.split(/\s*\:\s*/g)[0]))) : Number(nowTime.split(/\s*\:\s*/g)[0]) + 12;
    var currentMin = Number(nowTime.split(/\s*\:\s*/g)[1]);
    var todaysOpeningTime = $(`li:contains(` + currday + `)`).children('.sl-time').text();
    var firstEleDiv = $(`.sl-weekday:contains(`+currday+`)`).first()
    $('#first-element').text(firstEleDiv.html() + ' ' + ' ' + firstEleDiv.siblings().first().html());
    
    if(todaysOpeningTime){
        var arr = todaysOpeningTime.split(/\s*\-\s*/g);
        //break time to get opening hour
        var exactOpenHr = (arr[0].toLowerCase()).includes('am') ? (((Number(arr[0].split(/\s*\:\s*/g)[0])) == 12 ? 0 : Number(arr[0].split(/\s*\:\s*/g)[0]))) : Number(arr[0].split(/\s*\:\s*/g)[0]) + 12;
        var exactOpenMin = Number((arr[0].split(/\s*\:\s*/g)[1]).slice(0, -2));
        var openFlag =false;
        if (currentHr > exactOpenHr) {
            openFlag = true;
        }
        else if (currentHr == exactOpenHr && currentMin >= exactOpenMin) {
            openFlag = true;
        }
        if (openFlag){
            $('.closed').addClass('d-none');
            $('.opened').removeClass('d-none');
            $('#open-now').append(arr[1]);
        }else{
            $('.closed').removeClass('d-none');
        }
    }

});
