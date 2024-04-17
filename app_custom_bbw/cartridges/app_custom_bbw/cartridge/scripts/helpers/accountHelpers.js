'use strict';

var base = module.superModule;


/**
 * Validates that the input string is a valid date formatted as "mm/dd/yyyy"
 * @param {string} dateString - input date string
 * @returns {boolean} - value which indicate that entered DOB is valid or not
 */
function isValidDate(dateString) {

    var day = parseInt(dateString[0], 10);
    var month = parseInt(dateString[1], 10);
    var year = parseInt(dateString[2], 10);

    if (year < 1000 || year > 3000 || month === 0 || month > 12) {
        return false;
    }

    var monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
        monthLength[1] = 29;
    }

    return day > 0 && day <= monthLength[month - 1];
}

module.exports = {
    isValidDate: isValidDate
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
