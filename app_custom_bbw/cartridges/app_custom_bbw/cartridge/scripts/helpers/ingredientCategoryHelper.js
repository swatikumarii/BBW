/* eslint-disable no-mixed-spaces-and-tabs */

'use strict';

var Site = require('dw/system/Site');

/**
 * append category breadcrumbs to the viewData
 * @param {object} req - The request object for the current controller request
 * @param {object} res - The response object for the current controller request
 * @param {Function} next - Executes the next step in the controller chain
 */
function appendIngredientSearch(req, res, next) {
    var isIngredientSearch = false;
    var ingredientsNames = [];
    var viewData = res.getViewData();
    if (req.querystring.cgid === 'shop-by-ingredient') {
        isIngredientSearch = true;
        var productsIngredients = Site.current.getCustomPreferenceValue('productIngredients');
        if (productsIngredients) {
            ingredientsNames = productsIngredients.split(', ');
        }
    }

    viewData.ingredientsNames = ingredientsNames;
    viewData.isIngredientSearch = isIngredientSearch;
    res.setViewData(viewData);
    next();
}

module.exports = {
    appendIngredientSearch: appendIngredientSearch
};
