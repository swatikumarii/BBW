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

            if (fragranceName.toLowerCase().includes(searchPhrase.toLowerCase())) {
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
            for (var position = 0; position < hideAlphabets.length; position++) {
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

        // Remove border bottom from last 3 visible li elements
        var visibleLiElements = $('.alphabetically-data:visible');
        visibleLiElements.each(function (index, element) {
            if (index >= visibleLiElements.length - 2) {
                $(element).css('border-bottom', 'none');
            } else {
                $(element).css('border-bottom', '1px solid #ccc');
            }
        });
    });

    // search functionality for product ingredients
    $('#ingredient-search').on('change keyup', function (event) {
        $('#search-ingredient-div').removeClass('d-none');
        var searchTerm = $(event.currentTarget);
        var searchPhrase = searchTerm.val();
        var liElements = $('li.level-2');
        var showAlphabets = [];
        var hideAlphabets = [];

        liElements.each(function (index, element) {
            var a = $(element).find('a');
            var ingredientName = a.data('ingredientname');
            var ingredientNameStr = String(ingredientName);
            var searchPhraseStr = String(searchPhrase);
            if (ingredientNameStr.toLowerCase().includes(searchPhraseStr.toLowerCase())) {
                $(element).show();
                var showAlphabet = ingredientNameStr.charAt(0);
                if (showAlphabets.indexOf(showAlphabet) === -1) {
                    showAlphabets.push(showAlphabet);
                }
            } else {
                $(element).hide();
                var hideAlphabet = ingredientNameStr.charAt(0);
                if (hideAlphabets.indexOf(hideAlphabet) === -1) {
                    hideAlphabets.push(hideAlphabet);
                }
            }
        });

        if (hideAlphabets.length) {
            for (var position = 0; position < hideAlphabets.length; position++) {
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

    $('.fragrance-list-data').each(function () {
        var $group = $(this);
        var visibleItems = $group.find('.alphabetically-data');
        var itemCount = visibleItems.length;
        var columns = 4;

        visibleItems.removeClass('first second third fourth last-border');

        var remainder = itemCount % columns;
        var countFlag = 0;
        visibleItems.each(function () {
            var classIndex = countFlag % columns;
            $(this).addClass(['first', 'second', 'third', 'fourth'][classIndex]);
            if (countFlag >= itemCount - remainder) {
                $(this).addClass('last-border');
            }
            countFlag+=1;
        });
    });
});
