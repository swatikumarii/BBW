'use strict';

var server = require('server');
server.extend(module.superModule);

var site = require('dw/system/Site');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var commonHelpers = require('*/cartridge/models/scripts/util/commonHelpers');

/**
 * Get all online Greeting card products
 * @returns {dw.util.Collection} collection - Collection of online products.
 */
function getGreetingCardProducts() {
    return commonHelpers.fetchFullProducts(
        commonHelpers.getOnlineProductsByCategory(
            site.current.getCustomPreferenceValue('greetingCardCategoryName')
        )
    );
}

/**
 * Cart-Show : The Cart-Show endpoint
 * @name Cart-Show
 */
server.append(
    'Show',
    function (req, res, next) {
        var viewData = res.getViewData();
        viewData.isGreetingCardEnable = site.current.getCustomPreferenceValue(
            'isGreetingCardEnable'
        );
        viewData.greetingCardMessageLimit =
            site.current.getCustomPreferenceValue('greetingCardMessageLimit');
        viewData.greetingCardProducts = getGreetingCardProducts();
        res.setViewData(viewData);
        next();
    },
    pageMetaData.computedPageMetaData
);

/**
 * Cart-AddProduct : The Cart-MiniCart endpoint is responsible for displaying the cart icon in the header with the number of items in the current basket
 * @name Cart-AddProduct
 */
server.append('AddProduct', function (req, res, next) {

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var greetingCardCategoryName = site.current.getCustomPreferenceValue(
        'greetingCardCategoryName'
    );
    if (req.form.greetingCardMessage) {
        var greetingCardMessage = req.form.greetingCardMessage;
        var productLineItems = currentBasket.getAllProductLineItems().toArray();;
        Transaction.wrap(function () {
            for (var i = 0; i < productLineItems.length; i++) {
                var pli = productLineItems[i];
                if (
                    pli.product &&
                    pli.product.categories.length > 0
                ) {
                    if (
                        commonHelpers.isCategoryMatches(
                            pli.product,
                            greetingCardCategoryName
                        )
                    ) {
                        pli.custom.greetingCardMessage = greetingCardMessage;
                    }
                }
            }
        });
    }

    next();
});

module.exports = server.exports();
