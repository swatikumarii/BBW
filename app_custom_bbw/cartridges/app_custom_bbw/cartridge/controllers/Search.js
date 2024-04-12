'use strict';

var server = require('server');
server.extend(module.superModule);
var Site = require('dw/system/Site');


server.get('Fragrance', function(req, res, next) {
    var fragranceCategories = Site.current.getCustomPreferenceValue('fragranceCategories');
    var fragranceNamesList = Site.current.getCustomPreferenceValue('fragranceNames');
    var topFragrancesList = Site.current.getCustomPreferenceValue('topFragrances');
    var byCategories = JSON.parse(fragranceCategories);
    var isTopFragrance = false;
    var fragranceNamesArray = [];
    var topFragrancesLists;
    var currentSite = Site.current.ID;
    if (topFragrancesList) {
        topFragrancesLists = topFragrancesList.split(', ');
    }
    if(fragranceNamesList){
        var fragranceNames = fragranceNamesList.split(', ');
        for (var index = 0; index < fragranceNames.length; index++) {
            var firstLetter = fragranceNames[index][0].toUpperCase();
            if (topFragrancesLists) {
                isTopFragrance = topFragrancesLists.includes(fragranceNames[index]);
            }

            fragranceNamesArray[index] = {
                alphabet: firstLetter,
                name: fragranceNames[index],
                topFragrance: isTopFragrance
            };
        }
    }


    res.render('search/shopByFragrance', {
        fragranceCategories: byCategories,
        fragranceNames: fragranceNamesArray,
        currentSite: currentSite
    });

    next();
});

module.exports = server.exports();
