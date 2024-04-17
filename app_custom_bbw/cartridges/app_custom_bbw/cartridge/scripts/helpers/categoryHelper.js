'use strict';


/**
 * get level one category
 * @param  {object} category category
 * @returns  {Array} category level one
 */
function getLevelOneCategory(category) {
    if (category.parent.ID === 'root') {
        return category;
    }
    return getLevelOneCategory(category.parent);
}

/**
 * append level one category to the viewData
 * @param {object} req - The request object for the current controller request
 * @param {object} res - The response object for the current controller request
 * @param {Function} next - Executes the next step in the controller chain
 */
function appendLevelOneCategory(req, res, next) {
    var viewData = res.getViewData();
    if (viewData.apiProductSearch && viewData.apiProductSearch.category) {
        viewData.productSearch.levelOneCategory = getLevelOneCategory(
            viewData.apiProductSearch.category
        );
        res.setViewData(viewData);
    }
    next();
}

module.exports = {
    appendLevelOneCategory: appendLevelOneCategory
};
