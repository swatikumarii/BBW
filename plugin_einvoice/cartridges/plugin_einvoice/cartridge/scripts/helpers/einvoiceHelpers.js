'use strict';

/**
 * Checks if the provided date is in the same month as the current date.
 * @param {Date} date - The date to be validated
 * @returns {boolean} - True if the date is in the same month as the current date, otherwise false
 */
function isValidDate(date) {
    if (date.getMonth() === new Date().getMonth()) {
        return true;
    }
    return false;
}

module.exports = {
    isValidDate: isValidDate,
};
