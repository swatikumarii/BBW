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

    if(fragranceNamesList){
        var fragranceNames = fragranceNamesList.split(', ');
        for (let i = 0; i < fragranceNames.length; i++) {
            var firstLetter = fragranceNames[i][0].toUpperCase();
            if(topFragrancesList){
                const topFragrancesSet = new Set(topFragrancesList.split(', '));
                isTopFragrance = topFragrancesSet.has(fragranceNames[i]);
            }

            fragranceNamesArray[i] = {
                alphabet: firstLetter,
                name: fragranceNames[i],
                topFragrance: isTopFragrance,
            };
        }
    }


    res.render('product/shopByFragrance', {
        fragranceCategories: byCategories,
        fragranceNames : fragranceNamesArray
    });

    next();
});



module.exports = server.exports();
