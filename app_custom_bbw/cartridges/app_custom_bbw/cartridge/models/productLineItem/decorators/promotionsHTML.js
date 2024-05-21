'use strict';

var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

/**
 * get the rendered applied promotions
 * @param {object[]} promotions - an array of objects containing the product line items
 *                                    promotions
 * @returns {string} the rendered html for the applied promotions
 */
function getPromotionsHTML(promotions) {
    var context;
    var result = '';
    var template = 'checkout/productCard/productCardProductPromotions';
    var miniCart = request.httpParameterMap.isMiniCartTrigger.value
        ? request.httpParameterMap.isMiniCartTrigger.value
        : false;
    var cartPage = request.httpParameterMap.isCartPageTrigger.value
        ? request.httpParameterMap.isCartPageTrigger.value
        : false;

    if (promotions) {
        context = {
            lineItem: { promotions: promotions },
            miniCart: miniCart,
            cartPage: cartPage
        };
        result = renderTemplateHelper.getRenderedHtml(context, template);
    }

    return result;
}

module.exports = function (object, promotions) {
    Object.defineProperty(object, 'promotionsHTML', {
        enumerable: true,
        value: getPromotionsHTML(promotions)
    });
};
