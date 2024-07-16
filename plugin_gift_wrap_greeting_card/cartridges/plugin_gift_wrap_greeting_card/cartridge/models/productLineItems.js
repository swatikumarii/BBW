'use strict';

var base = module.superModule;

var collections = require('*/cartridge/scripts/util/collections');
var ProductFactory = require('*/cartridge/scripts/factories/product');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

/**
 * Creates an array of product line items
 * @param {dw.util.Collection<dw.order.ProductLineItem>} allLineItems - All product
 * line items of the basket
 * @param {string} view - the view of the line item (basket or order)
 * @returns {Array} an array of product line items.
 */
function createProductLineItemsObject(allLineItems, view) {
    var lineItems = [];
    collections.forEach(allLineItems, function (item) {
        // when item's category is unassigned, return a lineItem with limited attributes
        if (!item.product) {
            lineItems.push({
                id: item.productID,
                quantity: item.quantity.value,
                productName: item.productName,
                UUID: item.UUID,
                noProduct: true,
                images: {
                    small: [
                        {
                            url: URLUtils.staticURL('/images/noimagelarge.png'),
                            alt: Resource.msgf('msg.no.image', 'common', null),
                            title: Resource.msgf('msg.no.image', 'common', null)
                        }
                    ]
                }
            });
            return;
        }
        var options = collections.map(
            item.optionProductLineItems,
            function (optionItem) {
                return {
                    optionId: optionItem.optionID,
                    selectedValueId: optionItem.optionValueID
                };
            }
        );

        var bonusProducts = null;

        if (
            !item.bonusProductLineItem &&
            item.custom.bonusProductLineItemUUID &&
            item.custom.preOrderUUID
        ) {
            bonusProducts = [];
            collections.forEach(allLineItems, function (bonusItem) {
                if (
                    !!item.custom.preOrderUUID &&
                    bonusItem.custom.bonusProductLineItemUUID ===
                        item.custom.preOrderUUID
                ) {
                    var bpliOptions = collections.map(
                        bonusItem.optionProductLineItems,
                        function (boptionItem) {
                            return {
                                optionId: boptionItem.optionID,
                                selectedValueId: boptionItem.optionValueID
                            };
                        }
                    );
                    var params = {
                        pid: bonusItem.product.ID,
                        quantity: bonusItem.quantity.value,
                        variables: null,
                        pview: 'bonusProductLineItem',
                        containerView: view,
                        lineItem: bonusItem,
                        options: bpliOptions
                    };

                    bonusProducts.push(ProductFactory.get(params));
                }
            });
        }

        var params = {
            pid: item.product.ID,
            quantity: item.quantity.value,
            variables: null,
            pview: 'productLineItem',
            containerView: view,
            lineItem: item,
            options: options
        };
        var newLineItem = ProductFactory.get(params);
        newLineItem.bonusProducts = bonusProducts;
        if (
            newLineItem.bonusProductLineItemUUID === 'bonus' ||
            !newLineItem.bonusProductLineItemUUID
        ) {
            if (newLineItem.isGreetingCardCategory) {
                if ('greetingCardMessage' in item.custom) {
                    newLineItem.greetingCardMessage =
                        item.custom.greetingCardMessage;
                }
            } else if ('isWrapped' in item.custom && 'wrappedQuantity' in item.custom) {
                newLineItem.wrap = {
                    isWrapped: item.custom.isWrapped,
                    wrappedQuantity: item.custom.wrappedQuantity
                };
            }
            lineItems.push(newLineItem);
        }
    });
    return lineItems;
}

/**
 * @classdesc class that represents a collection of line items and total quantity of
 * items in current basket or per shipment
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - the product line items
 *                                                       of the current line item container
 * @param {string} view - the view of the line item (basket or order)
 */
function ProductLineItems(productLineItems, view) {
    if (productLineItems) {
        this.items = createProductLineItemsObject(productLineItems, view);
        this.totalQuantity = base.getTotalQuantity(productLineItems);
    } else {
        this.items = [];
        this.totalQuantity = 0;
    }
}

ProductLineItems.getTotalQuantity = base.getTotalQuantity;

module.exports = ProductLineItems;
