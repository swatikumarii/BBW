'use strict';

$(document).ready(function () {
    $('#noresult').hide();
    // search functionality for fragrance names
    $('#search-input').on('change keyup', function (event) {
        var searchTerm = $(event.currentTarget);
        var searchPhrase = searchTerm.val();
        var liElements = $('li.level-2');
        var showAlphabets = [];
        var hideAlphabets = [];

        liElements.each(function (index, element) {
            var a = $(element).find('a');
            var fragranceName = a.data('fragrancename');

            if (
                fragranceName.toLowerCase().includes(searchPhrase.toLowerCase())
            ) {
                $(element).show();
                var showAlphabet = fragranceName.charAt(0);
                if (showAlphabets.indexOf(showAlphabet) === -1) {
                    showAlphabets.push(showAlphabet);
                }
            } else {
                $(element).hide();
                var hideAlphabet = fragranceName.charAt(0);
                if (hideAlphabets.indexOf(hideAlphabet) === -1) {
                    hideAlphabets.push(hideAlphabet);
                }
            }
        });

        if (hideAlphabets.length) {
            for (
                var position = 0;
                position < hideAlphabets.length;
                position++
            ) {
                var alphabetDiv = $('#' + hideAlphabets[position]);
                if (showAlphabets.indexOf(hideAlphabets[position]) === -1) {
                    alphabetDiv.hide();
                } else {
                    alphabetDiv.show();
                }
            }
        } else {
            for (var i = 0; i < showAlphabets.length; i++) {
                $('#' + showAlphabets[i]).show();
            }
        }

        if (!showAlphabets.length) {
            $('#noresult').show();
        } else {
            $('#noresult').hide();
        }
    });

    // search functionality for product ingredients
    $('#ingredient-search').on('change keyup', function (event) {
        var searchTerm = $(event.currentTarget);
        var searchPhrase = searchTerm.val();
        var liElements = $('li.level-2');
        var showAlphabets = [];
        var hideAlphabets = [];

        liElements.each(function (index, element) {
            var a = $(element).find('a');
            var ingredientName = a.data('ingredientname');

            if (
                ingredientName
                    .toLowerCase()
                    .includes(searchPhrase.toLowerCase())
            ) {
                $(element).show();
                var showAlphabet = ingredientName
                    .match(/[a-z]/i)[0]
                    .toUpperCase();
                if (showAlphabets.indexOf(showAlphabet) === -1) {
                    showAlphabets.push(showAlphabet);
                }
            } else {
                $(element).hide();
                var hideAlphabet = ingredientName
                    .match(/[a-z]/i)[0]
                    .toUpperCase();
                if (hideAlphabets.indexOf(hideAlphabet) === -1) {
                    hideAlphabets.push(hideAlphabet);
                }
            }
        });

        if (hideAlphabets.length) {
            for (
                var position = 0;
                position < hideAlphabets.length;
                position++
            ) {
                var alphabetDiv = $('#' + hideAlphabets[position]);
                if (showAlphabets.indexOf(hideAlphabets[position]) === -1) {
                    alphabetDiv.hide();
                } else {
                    alphabetDiv.show();
                }
            }
        } else {
            for (var i = 0; i < showAlphabets.length; i++) {
                $('#' + showAlphabets[i]).show();
            }
        }

        if (!showAlphabets.length) {
            $('#noresult').show();
        } else {
            $('#noresult').hide();
        }
    });
});
