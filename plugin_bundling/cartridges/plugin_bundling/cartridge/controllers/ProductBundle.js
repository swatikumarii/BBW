'use strict';

var server = require('server');

/**
 * AddToBundle : Add product to bundle ( storing details in session till added to basket )
 */
server.post('AddToBundle', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var productID = req.form.pid;
    var bundle = session.custom.productBundle;
    if (bundle === null) {
        bundle = [];
    } else {
        bundle = JSON.parse(bundle);
    }
    bundle.push(productID);
    session.custom.productBundle = JSON.stringify(bundle);
    res.json({
        error: false,
        messageType: 'alert-success',
        msg: Resource.msg('added.to.bundle', 'productBundle', null)
    });

    return next();
});


/**
 * ProductBundle-Show : This endpoint is called to show the details of the selected product
 */
server.post('Show', function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var showProductPageHelperResult = productHelper.showProductPage(req.form, req.pageMetaData);
    var productDetails = ProductMgr.getProduct(showProductPageHelperResult.product.id);
    if (productDetails && 'custom' in productDetails && 'collection' in productDetails.custom) {
        showProductPageHelperResult.product.collection = productDetails.custom.collection;
    }

    res.render('experience/components/product_bundle/components/productDetail', {
        product: showProductPageHelperResult.product,
        addToCartUrl: showProductPageHelperResult.addToCartUrl,
        resources: showProductPageHelperResult.resources,
        breadcrumbs: showProductPageHelperResult.breadcrumbs,
        canonicalUrl: showProductPageHelperResult.canonicalUrl,
        schemaData: showProductPageHelperResult.schemaData
    });

    next();
});

// server.post('AddProduct', function (req, res, next) {
//     // for determining whether operation involves custom bundle products or not
//     var collections = require('*/cartridge/scripts/util/collections');
//     var BasketMgr = require('dw/order/BasketMgr');
//     var Transaction = require('dw/system/Transaction');
//     var currentBasket = BasketMgr.getCurrentBasket();

//     session.custom.addingBundle = false;
//     if (req.form.isCustomBundle === 'true') {
//         var isCustomBundle = false;
//         var customBundlesInCart = {};
//         var name = [];
//         var qty = [];
//         var index;
//         if (req.form.isCustomBundle === 'true') {
//             isCustomBundle = true;
//         }
//         var bundle = JSON.parse(session.custom.bundle);
//         var position = bundle.name.indexOf(req.form.currentBundle);
//         var bundlesInCart = session.custom.customBundlesInCart;
//         if (!bundlesInCart) {
//             name[0] = req.form.currentBundle;
//             qty[0] = 1;
//             customBundlesInCart = {
//                 name: name,
//                 qty: qty
//             };
//             session.custom.customBundlesInCart =
//                 JSON.stringify(customBundlesInCart);
//             index = 1;
//         } else {
//             customBundlesInCart = JSON.parse(
//                 session.custom.customBundlesInCart
//             );
//             var positionInCart = customBundlesInCart.name.indexOf(
//                 req.form.currentBundle
//             );
//             if (positionInCart < 0) {
//                 positionInCart = customBundlesInCart.name.length;
//                 customBundlesInCart.name[customBundlesInCart.name.length] =
//                     req.form.currentBundle;
//                 customBundlesInCart.qty[customBundlesInCart.qty.length] = 0;
//             }
//             if (
//                 bundle.buyLimit[position] <=
//                 customBundlesInCart.qty[positionInCart]
//             ) {
//                 var message =
//                     'You have reached maximum bundles(' +
//                     bundle.buyLimit[position] +
//                     ') that can be purchased in one order.';
//                 res.json({
//                     error: true,
//                     message: message
//                 });
//                 this.emit('route:Complete', req, res);
//                 return;
//             }
//             customBundlesInCart.qty[positionInCart]++;
//             session.custom.customBundlesInCart =
//                 JSON.stringify(customBundlesInCart);
//             index = customBundlesInCart.qty[positionInCart];
//         }
//         var customBundleObj = {
//             currentBundle: req.form.currentBundle,
//             isCustomBundle: isCustomBundle,
//             index: index
//         };
//         session.custom.isCustomBundle = JSON.stringify(customBundleObj);
//         session.custom.addingBundle = true;
//         var productsinCart = {
//             normalproductLineItems: [],
//             bonusProductId: [],
//             bonusProductList: [],
//             hasBundleProduct: false,
//             hasNormalProduct: false
//         };
//         if (currentBasket) {
//             var bonusProducts = currentBasket.getBonusDiscountLineItems();
//             var parentProductUUID;
//             collections.forEach(
//                 bonusProducts,
//                 function (bonusDiscountLineItem) {
//                     var bonusLineItem = {};
//                     var bonusProductItem = {};
//                     bonusLineItem.bonusProductItems = bonusDiscountLineItem;
//                     parentProductUUID =
//                         bonusDiscountLineItem.custom.bonusProductLineItemUUID;
//                     var parentProduct = collections.find(
//                         currentBasket.getAllProductLineItems(),
//                         function (productLineItem) {
//                             return productLineItem.UUID === parentProductUUID;
//                         }
//                     );
//                     bonusLineItem.parentID = parentProduct.productID;
//                     collections.forEach(
//                         bonusDiscountLineItem.getBonusProductLineItems(),
//                         function (dli) {
//                             if (dli.product) {
//                                 productsinCart.bonusProductId.push(
//                                     dli.productID
//                                 );
//                                 bonusProductItem.pid = dli.productID;
//                                 bonusProductItem.pLineItem = dli;
//                             }
//                         }
//                     );
//                     var updatedList = Object.assign(
//                         bonusLineItem,
//                         bonusProductItem
//                     );
//                     productsinCart.bonusProductList.push(updatedList);
//                 }
//             );
//             collections.forEach(
//                 currentBasket.productLineItems,
//                 function (productLineItem) {
//                     if (
//                         'custom' in productLineItem &&
//                         'isCustomBundleProduct' in productLineItem.custom &&
//                         productLineItem.custom.isCustomBundleProduct
//                     ) {
//                         productsinCart.hasBundleProduct = true;
//                     }
//                     if (
//                         'bonusProductLineItem' in productLineItem &&
//                         productLineItem.bonusProductLineItem === false
//                     ) {
//                         productsinCart.hasNormalProduct = true;
//                         var pli = {};
//                         var customBundle = {};
//                         customBundle.currentBundle =
//                             'currentCustomBundle' in productLineItem.custom
//                                 ? productLineItem.custom.currentCustomBundle
//                                 : null;
//                         customBundle.index =
//                             'currentCustomBundleIndex' in productLineItem.custom
//                                 ? productLineItem.custom
//                                     .currentCustomBundleIndex
//                                 : null;
//                         customBundle.isCustomBundle =
//                             'isCustomBundleProduct' in productLineItem.custom
//                                 ? productLineItem.custom.isCustomBundleProduct
//                                 : null;
//                         pli.customBundle = customBundle;
//                         pli.originalPLI = productLineItem;
//                         productsinCart.normalproductLineItems.push(pli);
//                     }
//                 }
//             );
//             if (productsinCart.hasNormalProduct) {
//                 productsinCart.normalproductLineItems.forEach(
//                     function (normalProductLineItem) {
//                         Transaction.wrap(function () {
//                             currentBasket.removeProductLineItem(
//                                 normalProductLineItem.originalPLI
//                             );
//                         });
//                     }
//                 );
//             }
//             // var viewData = res.getViewData();
//             // viewData.productsinCart = productsinCart;
//             // res.setViewData(viewData);
//         }
//     }

//     res.json({
//         reportingURL: reportingURL,
//         quantityTotal: quantityTotal,
//         message: result.message,
//         cart: cartModel,
//         newBonusDiscountLineItem: newBonusDiscountLineItem || {},
//         error: result.error,
//         pliUUID: result.uuid,
//         minicartCountOfItems: Resource.msgf(
//             'minicart.count',
//             'common',
//             null,
//             quantityTotal
//         )
//     });

//     next();
// });



server.post('AddProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var bundlingHelpers = require('*/cartridge/scripts/helpers/bundlingHelpers');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var previousBonusDiscountLineItems =
        currentBasket.getBonusDiscountLineItems();
    // var productId = req.form.pid;
    var childProducts = Object.hasOwnProperty.call(req.form, 'childProducts')
        ? JSON.parse(req.form.childProducts)
        : [];
    // var options = req.form.options ? JSON.parse(req.form.options) : [];
    var quantity;
    var result;
    var pidsObj;

    var customBundlesInCart = {};
    var bundle = JSON.parse(session.custom.bundle);
    var position = bundle.name.indexOf(req.form.currentBundle);
    var bundlesInCart = session.custom.customBundlesInCart;
    if (!bundlesInCart) {
        customBundlesInCart = {
            name: [req.form.currentBundle],
            qty: [1]
        };
        session.custom.customBundlesInCart =
            JSON.stringify(customBundlesInCart);
    } else {
        customBundlesInCart = JSON.parse(session.custom.customBundlesInCart);
        var positionInCart = customBundlesInCart.name.indexOf(
            req.form.currentBundle
        );
        if (positionInCart < 0) {
            positionInCart = customBundlesInCart.name.length;
            customBundlesInCart.name[customBundlesInCart.name.length] =
                req.form.currentBundle;
            customBundlesInCart.qty[customBundlesInCart.qty.length] = 0;
        }
        if (
            bundle.buyLimit[position] <= customBundlesInCart.qty[positionInCart]
        ) {
            var message =
                'You have reached maximum bundles(' +
                bundle.buyLimit[position] +
                ') that can be purchased in one order.';
            res.json({
                error: true,
                message: message
            });
            this.emit('route:Complete', req, res);
            return;
        }
        customBundlesInCart.qty[positionInCart]++;
        session.custom.customBundlesInCart =
            JSON.stringify(customBundlesInCart);
    }

    if (currentBasket) {
        Transaction.wrap(function () {
            // product set
            pidsObj = JSON.parse(req.form.pidsObj);
            result = {
                error: false,
                message: Resource.msg(
                    'text.alert.addedtobasket',
                    'product',
                    null
                )
            };

            pidsObj.forEach(function (PIDObj) {
                quantity = parseInt(PIDObj.qty, 10);
                var pidOptions = PIDObj.options
                    ? JSON.parse(PIDObj.options)
                    : {};
                var PIDObjResult = bundlingHelpers.addProductToCart(
                    currentBasket,
                    PIDObj.pid,
                    quantity,
                    childProducts,
                    pidOptions,
                    req.form.currentBundle
                );

                if (PIDObjResult.error) {
                    result.error = PIDObjResult.error;
                    result.message = PIDObjResult.message;
                }
            });
            if (!result.error) {
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                basketCalculationHelpers.calculateTotals(currentBasket);
            }
        });
    }

    var quantityTotal = ProductLineItemsModel.getTotalQuantity(
        currentBasket.productLineItems
    );
    var cartModel = new CartModel(currentBasket);

    var urlObject = {
        url: URLUtils.url('Cart-ChooseBonusProducts').toString(),
        configureProductstUrl: URLUtils.url(
            'Product-ShowBonusProducts'
        ).toString(),
        addToCartUrl: URLUtils.url('Cart-AddBonusProducts').toString()
    };

    var newBonusDiscountLineItem = cartHelper.getNewBonusDiscountLineItem(
        currentBasket,
        previousBonusDiscountLineItems,
        urlObject,
        result.uuid
    );
    if (newBonusDiscountLineItem) {
        var allLineItems = currentBasket.allProductLineItems;
        var collections = require('*/cartridge/scripts/util/collections');
        collections.forEach(allLineItems, function (pli) {
            if (pli.UUID === result.uuid) {
                Transaction.wrap(function () {
                    pli.custom.bonusProductLineItemUUID = 'bonus'; // eslint-disable-line no-param-reassign
                    pli.custom.preOrderUUID = pli.UUID; // eslint-disable-line no-param-reassign
                });
            }
        });
    }

    var reportingURL = cartHelper.getReportingUrlAddToCart(
        currentBasket,
        result.error
    );

    res.json({
        reportingURL: reportingURL,
        quantityTotal: quantityTotal,
        message: result.message,
        cart: cartModel,
        newBonusDiscountLineItem: newBonusDiscountLineItem || {},
        error: result.error,
        pliUUID: result.uuid,
        minicartCountOfItems: Resource.msgf(
            'minicart.count',
            'common',
            null,
            quantityTotal
        )
    });

    next();
});

module.exports = server.exports();
