'use strict';

$(document).ready(function () {
    var noresultDiv = document.getElementById('noresult');
    noresultDiv.style.display = 'none';
    $('#search-input').on('change keyup', function (event) {
        var searchTerm = event.currentTarget;
        var searchPhrase = $(searchTerm).val();
        var liElements = document.querySelectorAll('li.level-2');
        var showAlphabets = [];
        var hideAlphabets = [];
        var showAlphabet;
        var hideAlphabet;

        for (var index = 0; index < liElements.length; index++) {
            var a = liElements[index].querySelector('a');

            var fragranceName = a.getAttribute('data-fragrancename');

            if (
                fragranceName.toLowerCase().includes(searchPhrase.toLowerCase())
            ) {
                liElements[index].style.display = 'block';
                showAlphabet = fragranceName.charAt(0);
                if (!showAlphabets.includes(showAlphabet)) {
                    showAlphabets.push(showAlphabet);
                }
            } else {
                liElements[index].style.display = 'none';
                hideAlphabet = fragranceName.charAt(0);
                if (!hideAlphabets.includes(hideAlphabet)) {
                    hideAlphabets.push(hideAlphabet);
                }
            }
        }

        if (hideAlphabets.length){
            for (var position = 0; position < hideAlphabets.length; position++) {
                if (!showAlphabets.includes(hideAlphabets[position])) {

                    document.getElementById(hideAlphabets[position]).style.display =
                        'none';
                } else {
                    document.getElementById(hideAlphabets[position]).style.display =
                        'block';
                }
            }
        }else{
            for (var i = 0; i < showAlphabets.length; i++) {
                document.getElementById(showAlphabets[i]).style.display = 'block';
            }
        }
        if (!showAlphabets.length) {
            noresultDiv.style.display = 'block';
        }else{
            noresultDiv.style.display = 'none';
        }
    });
});
