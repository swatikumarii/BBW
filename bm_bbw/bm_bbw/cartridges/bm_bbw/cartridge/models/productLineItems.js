'use strict';

var formatMoney = require("dw/util/StringUtils").formatMoney;

var collections = require('*/cartridge/scripts/util/collections');
var ProductMgr = require('dw/catalog/ProductMgr');

var ImageModel = require("*/cartridge/models/product/productImages");

/**
 * If a product is master and only have one variant for a given attribute - auto select it
 * @param {dw.catalog.Product} apiProduct - Product from the API
 * @param {Object} params - Parameters passed by querystring
 *
 * @returns {Object} - Object with selected parameters
 */
function normalizeSelectedAttributes(apiProduct, params) {
    if (!apiProduct.master) {
        return params.variables;
    }

    var variables = params.variables || {};
    if (apiProduct.variationModel) {
        collections.forEach(apiProduct.variationModel.productVariationAttributes, function (attribute) {
            var allValues = apiProduct.variationModel.getAllValues(attribute);
            if (allValues.length === 1) {
                variables[attribute.ID] = {
                    id: apiProduct.ID,
                    value: allValues.get(0).ID
                };
            }
        });
    }

    return Object.keys(variables) ? variables : null;
}

/**
 * Normalize product and return Product variation model
 * @param  {dw.catalog.Product} product - Product instance returned from the API
 * @param  {Object} productVariables - variables passed in the query string to
 *                                     target product variation group
 * @return {dw.catalog.ProductVarationModel} Normalized variation model
 */
function getVariationModel(product, productVariables) {
    var variationModel = product.variationModel;
    if (!variationModel.master && !variationModel.selectedVariant) {
        variationModel = null;
    } else if (productVariables) {
        var variationAttrs = variationModel.productVariationAttributes;
        Object.keys(productVariables).forEach(function (attr) {
            if (attr && productVariables[attr].value) {
                var dwAttr = collections.find(
                    variationAttrs,
                    function (item) { return item.ID === attr; }
                );
                var dwAttrValue = collections.find(
                    variationModel.getAllValues(dwAttr),
                    function (item) { return item.value === productVariables[attr].value; }
                );
                if (dwAttr && dwAttrValue) {
                    variationModel.setSelectedAttributeValue(dwAttr.ID, dwAttrValue.ID);
                }
            }
        });
    }
    return variationModel;
}

/**
 * Provides a current option model by setting selected option values
 *
 * @param {dw.catalog.ProductOptionModel} optionModel - Product's option model
 * @param {SelectedOption[]} selectedOptions - Options selected in UI
 * @return {dw.catalog.ProductOptionModel} - Option model updated with selected options
 */
function getCurrentOptionModel(optionModel, selectedOptions) {
    var productOptions = optionModel.options;
    var selectedValue;
    var selectedValueId;

    if (selectedOptions && selectedOptions.length) {
        collections.forEach(productOptions, function (option) {
            selectedValueId = selectedOptions.filter(function (selectedOption) {
                return selectedOption.optionId === option.ID;
            })[0].selectedValueId;
            selectedValue = optionModel.getOptionValue(option, selectedValueId);
            optionModel.setSelectedOptionValue(option, selectedValue);
        });
    }

    return optionModel;
}

/**
 * Return type of the current product
 * @param  {dw.catalog.ProductVariationModel} product - Current product
 * @return {string} type of the current product
 */
function getProductType(product) {
    var result;
    if (product.master) {
        result = 'master';
    } else if (product.variant) {
        result = 'variant';
    } else if (product.variationGroup) {
        result = 'variationGroup';
    } else if (product.productSet) {
        result = 'set';
    } else if (product.bundle) {
        result = 'bundle';
    } else if (product.optionProduct) {
        result = 'optionProduct';
    } else {
        result = 'standard';
    }
    return result;
}

/**
 * Get information for model creation
 * @param {dw.catalog.Product} apiProduct - Product from the API
 * @param {Object} params - Parameters passed by querystring
 *
 * @returns {Object} - Config object
 */
function getConfig(apiProduct, params) {
    var variables = normalizeSelectedAttributes(apiProduct, params);
    var variationModel = getVariationModel(apiProduct, variables);
    if (variationModel) {
        apiProduct = variationModel.selectedVariant || apiProduct; // eslint-disable-line
    }
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
    var optionsModel = getCurrentOptionModel(apiProduct.optionModel, params.options);
    var options = {
        variationModel: variationModel,
        options: params.options,
        optionModel: optionsModel,
        promotions: promotions,
        quantity: params.quantity,
        variables: variables,
        apiProduct: apiProduct,
        productType: getProductType(apiProduct)
    };

    return 'options';
}

function getImages(apiProduct, options, params) {
  var product;
  var config = {
    types: [
      "mediumLarge",
      "extraLarge",
      "small",
      "mediumLarge_2x",
      "extraLarge_2x",
      "small_2x",
    ],
    quantity: "all",
  };
  product = apiProduct;
  return new ImageModel(product, config);
}

function getPrice(product, options) {
    var priceFactory = require("*/cartridge/scripts/factories/price");
    return priceFactory.getPrice(product, null, false, options.promotions, options.optionModel)
}

/**
 * get the total price for the product line item
 * @param {dw.order.ProductLineItem} lineItem - API ProductLineItem instance
 * @returns {object} an object containing the product line item total info.
 */
function getTotalPrice(lineItem) {//priceTotal
    var context;
    var price;
    var result = {};

    if (lineItem.priceAdjustments.getLength() > 0) {
        result.nonAdjustedPrice = formatMoney(lineItem.getPrice());
    }

    price = lineItem.adjustedPrice;

    // The platform does not include prices for selected option values in a line item product's
    // price by default.  So, we must add the option price to get the correct line item total price.
    collections.forEach(lineItem.optionProductLineItems, function (item) {
        price = price.add(item.adjustedPrice);
    });

    result.price = formatMoney(price);
    result.priceValue = price.value;
    context = { lineItem: { priceTotal: result } };

    result.priceValue = price.value;
    return result;
}

/**
 * Get Egift Card Details
 * @param {object} item - line item
 * @returns {object} giftCardDetails
 */
function getEgiftCardDetails(item) {
  // Set Card Details
  var cardInfo = {
    recipientEmail: item.custom.eGiftReceiverEmail || "",
    isEgiftProduct: item.custom.isEgiftCard || false,
  };
  return cardInfo;
}

/**
 * Creates an array of product line items
 * @param {dw.util.Collection<dw.order.ProductLineItem>} allLineItems - All product
 * line items of the basket
 * @param {string} view - the view of the line item (basket or order)
 * @returns {Array} an array of product line items.
 */
function createProductLineItemsObject(allLineItems, view) {
    var Site = require('dw/system/Site');
    var lineItems = [];
    var enableQCeGift = Site.current.getCustomPreferenceValue('enableQwikcilver');

    collections.forEach(allLineItems, function (item) {
        var apiProduct = ProductMgr.getProduct(item.productID);
        var options = collections.map(
          item.optionProductLineItems,
          function (optionItem) {
            return {
              optionId: optionItem.optionID,
              selectedValueId: optionItem.optionValueID,
            };
          }
        );
        var params = {
            pid: item.product.ID,
            quantity: item.quantity.value,
            variables: null,
            pview: 'productLineItem',
            containerView: view,
            lineItem: item,
            options: options
        };


        if (view === '') {
            
        } else {
            var greetingCardMessage = null;
            if ('greetingCardMessage' in item.custom && item.custom.greetingCardMessage) {
                greetingCardMessage = item.custom.greetingCardMessage;
            }
            var options = getConfig(apiProduct, params);
            var images = getImages(apiProduct, options, params);
            var price = getPrice(apiProduct, options);
            var product = {
            id: apiProduct.ID,
            UUID: item.UUID,
            images: images,
            fragranceName:
                "custom" in apiProduct &&
                "fragranceName" in apiProduct.custom &&
                apiProduct.custom.fragranceName !== ""
                ? apiProduct.custom.fragranceName
                : false,
            productName: apiProduct.name,
            titlePartB:
                "custom" in apiProduct &&
                "titlePartB" in apiProduct.custom &&
                apiProduct.custom.titlePartB !== ""
                ? apiProduct.custom.titlePartB
                : false,
            volume:
                "custom" in apiProduct &&
                "volume" in apiProduct.custom &&
                apiProduct.custom.volume !== ""
                ? apiProduct.custom.volume
                : false,
            greetingCardMessage: greetingCardMessage,
            priceTotal: getTotalPrice(item),
            giftCardDetails: getEgiftCardDetails(item),
            quantity: item.quantity,
            noProduct: null,
            basePrice: "basePrice" in item ? item.basePrice : "",
            price: price
            };
        }
        lineItems.push(product);
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
        return {
            items: createProductLineItemsObject(productLineItems, view)
        }
    } else {
        return {
          items: []
        };
    }
}

module.exports = ProductLineItems;
