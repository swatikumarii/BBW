'use strict';

var server = require('server');

var Site = require('dw/system/Site');

/**
 * Fragrance-Show : The Fragrance-Show enpoint show the fragrance categories and fragrance name
 */
server.get('Show', function(req, res, next) {
    var fragranceCategories = Site.current.getCustomPreferenceValue('fragranceCategories');
    var fragranceNamesList = Site.current.getCustomPreferenceValue('fragranceNames');
    var topFragrancesList = Site.current.getCustomPreferenceValue('topFragrances');
    var byCategories = JSON.parse(fragranceCategories);
    var isTopFragrance = false;
    var fragranceNamesArray = [];
    var topFragrancesLists;
    var currentSite = Site.current.ID;
    var fragranceObj = {};
    if (topFragrancesList) {
        topFragrancesLists = topFragrancesList.split(', ');
    }
    if (fragranceNamesList) {
        var fragranceNames = fragranceNamesList.split(', ');
        for (var index = 0; index < fragranceNames.length; index++) {
            var alphabet = fragranceNames[index][0].toUpperCase();
            if (topFragrancesLists) {
                isTopFragrance = topFragrancesLists.includes(
                    fragranceNames[index]
                );
            }

            if (!fragranceObj[alphabet]) {
                fragranceObj[alphabet] = [];
            }

            fragranceObj[alphabet].push({
                topFragrance: isTopFragrance,
                name: fragranceNames[index]
            });
        }
    }
    if (fragranceObj) {
        fragranceNamesArray = Object.entries(fragranceObj).map(
            function (entry) {
                return { key: entry[0], value: entry[1] };
            }
        );
    }

    res.render('fragrance/shopByFragrance', {
        fragranceCategories: byCategories,
        fragranceNames: fragranceNamesArray,
        currentSite: currentSite
    });

    next();
});

/**
 * Fragrance-Ingredient : The Fragrance-Ingredient enpoint show the ingredients of proudcts
 */
server.get('Ingredient', function (req, res, next) {
    var productsIngredients = Site.current.getCustomPreferenceValue('productIngredients');
    var ingredientNamesArray = [];
    var ingredientsNames;
    var ingredientObj = {};

    if (productsIngredients) {
        ingredientsNames = productsIngredients.split(', ');
        for (var index = 0; index < ingredientsNames.length; index++) {
            var firstLetter = ingredientsNames[index].match(/[a-z]/i)[0].toUpperCase();
            if (!ingredientObj[firstLetter]) {
                ingredientObj[firstLetter] = [];
            }

            ingredientObj[firstLetter].push({
                name: ingredientsNames[index]
            });
        }
        if (ingredientObj) {
            ingredientNamesArray = Object.entries(ingredientObj).map(
                function (entry) {
                    return { key: entry[0], value: entry[1] };
                }
            );
        }
    }

    res.render('fragrance/shopByIngredient', {
        ingredientsNames: ingredientNamesArray
    });

    next();
});

module.exports = server.exports();
