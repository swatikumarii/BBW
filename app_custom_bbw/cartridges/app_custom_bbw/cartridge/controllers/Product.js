'use strict';

var server = require('server');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');

server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var list = productListHelper.getCurrentOrNewList(req.currentCustomer.raw, {
        type: 10
    });
    var pid = req.querystring.pid || req.form.pid;
    var optionId = req.querystring.optionId || req.form.optionId  || null;
    var optionVal = req.querystring.optionVal || req.form.optionVal || null;

    var config = {
        qty: 1,
        optionId: optionId,
        optionValue: optionVal,
        req: req,
        type: 10
    };
    var itemExist = productListHelper.itemExists(list, pid, config);

    var viewData = res.getViewData();
    var currentPageMeta = viewData.CurrentPageMetaData || {};
    var description = (
        viewData.product.fragranceDescription ||
        viewData.product.shortDescription ||
        viewData.product.longDescription
    );
    currentPageMeta.description = description
        ? description.markup.replace(/<[^>]*>/g, '')
        : description;
    currentPageMeta.pageMetaTags = currentPageMeta.pageMetaTags || [];
    if (currentPageMeta.description) {
        currentPageMeta.pageMetaTags.push({
            content: currentPageMeta.description,
            ID: 'og:description',
            name: false,
            property: true,
            title: false
        });
    }
    var removeLineItemURL = URLUtils.url('Giftcard-RemoveLineItems');
    var userEmail = req.currentCustomer.raw.registered
        ? req.currentCustomer.profile.email
        : false;
    var productRecord = CustomObjectMgr.getCustomObject(
        'notifyBackInStock',
        pid
    );
    var productPresentInNotifyList = false;
    if (
        (userEmail) && (productRecord !== null) &&
        productRecord.custom.user.indexOf(userEmail) !== -1
    ) {
        productPresentInNotifyList = true;
    }

    var Template = require('dw/util/Template');
    var HashMap = require('dw/util/HashMap');
    var giftPopupTemplate = new Template('product/giftpopup');
    var context = new HashMap();
    context.put('a',viewData.product.giftContent);
    var giftPopupHTML = giftPopupTemplate.render(context).text;

    res.setViewData({
        productPresentInNotifyList:productPresentInNotifyList,
        itemExist: itemExist,
        CurrentPageMetaData: currentPageMeta,
        removeLineItemURL: removeLineItemURL,
        giftPopupHTML: giftPopupHTML
    });
    next();
});

server.prepend('Show', function (req, res, next) {
    var qwikcilverHelpers = require('*/cartridge/scripts/helpers/qwikcilverHelpers');
    var URLUtils = require('dw/web/URLUtils');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var recepientForm = server.forms.getForm('recipients');
    var months = qwikcilverHelpers.getMonths();
    var days = qwikcilverHelpers.getNoOfDaysOfMonth();
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var removeLineItemURL = URLUtils.url('Giftcard-RemoveLineItems');
    var giftCard = ProductFactory.get({pid: req.querystring.pid});


    res.setViewData({
        giftCard: giftCard,
        recepientForm: recepientForm,
        months: months,
        days: days,
        addToCartUrl: addToCartUrl,
        removeLineItemURL: removeLineItemURL,
        product: giftCard
    });
    next();
});

server.append('ShowQuickView', function (req, res, next) {
    var list = productListHelper.getCurrentOrNewList(req.currentCustomer.raw, {
        type: 10
    });
    var pid = req.querystring.pid || req.form.pid;
    var optionId = req.querystring.optionId || req.form.optionId  || null;
    var optionVal = req.querystring.optionVal || req.form.optionVal || null;

    var config = {
        qty: 1,
        optionId: optionId,
        optionValue: optionVal,
        req: req,
        type: 10
    };

    var itemExist = productListHelper.itemExists(list, pid, config);
    res.setViewData({itemExist: itemExist});
    next();
});

/**
 * Product-ShowBonusProducts : This endpoint is called when a product with bonus product is added to Cart
 * @name Product-ShowBonusProducts - Replaces base function
 * @function
 */
server.replace('ShowBonusProducts', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var moreUrl = null;
    var pagingModel;
    var products = [];
    var product;
    var duuid = req.querystring.DUUID;
    var collections = require('*/cartridge/scripts/util/collections');
    var BasketMgr = require('dw/order/BasketMgr');
    var URLUtils = require('dw/web/URLUtils');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var showMoreButton;
    var selectedBonusProducts;
    var initialAddBonusProduct = false;
    var initialAddBonusProductUrl;

    if (duuid) {
        var bonusDiscountLineItem = collections.find(currentBasket.getBonusDiscountLineItems(), function (item) {
            return item.UUID === duuid;
        });

        if (bonusDiscountLineItem && bonusDiscountLineItem.bonusProductLineItems.length) {
            selectedBonusProducts = collections.map(bonusDiscountLineItem.bonusProductLineItems, function (bonusProductLineItem) {
                var option = {
                    optionid: '',
                    selectedvalue: ''
                };
                if (!bonusProductLineItem.optionProductLineItems.empty) {
                    option.optionid = bonusProductLineItem.optionProductLineItems[0].optionID;
                    option.optionid = bonusProductLineItem.optionProductLineItems[0].optionValueID;
                }
                return {
                    pid: bonusProductLineItem.productID,
                    name: bonusProductLineItem.productName,
                    submittedQty: (bonusProductLineItem.quantityValue),
                    option: option
                };
            });
        } else {
            selectedBonusProducts = [];
            initialAddBonusProduct = true;
        }

        if (req.querystring.pids) {
            var params = req.querystring.pids.split(',');
            var bonusProductToAdd = params.find(function (bonusProduct) {
                var apibonusProduct = ProductMgr.getProduct(bonusProduct);
                if (apibonusProduct.availabilityModel.availability > 0) {
                    return apibonusProduct.ID;
                }
            });
            if (initialAddBonusProduct) {
                var pidsObj = {
                    bonusProducts: [{
                        pid: bonusProductToAdd,
                        qty: bonusDiscountLineItem.maxBonusItems,
                        options: [null]

                    }],
                    totalQty: bonusDiscountLineItem.maxBonusItems
                };
                var uuid = bonusDiscountLineItem.UUID;
                var pliuuid = bonusDiscountLineItem.custom.bonusProductLineItemUUID;
                initialAddBonusProductUrl = URLUtils.url('Cart-AddBonusProducts', 'pids', JSON.stringify(pidsObj), 'uuid', uuid, 'pliuuid', pliuuid).toString();
            }
            products = params.map(function (param) {
                product = ProductFactory.get({
                    pid: param,
                    pview: 'bonus',
                    duuid: duuid
                });
                return product;
            });
        } else {
            var PagingModel = require('dw/web/PagingModel');
            var pageStart = parseInt(req.querystring.pagestart, 10);
            var pageSize = parseInt(req.querystring.pagesize, 10);
            showMoreButton = true;

            var ProductSearchModel = require('dw/catalog/ProductSearchModel');
            var apiProductSearch = new ProductSearchModel();
            var productSearchHit;
            apiProductSearch.setPromotionID(bonusDiscountLineItem.promotionID);
            apiProductSearch.setPromotionProductType('bonus');
            apiProductSearch.search();
            pagingModel = new PagingModel(apiProductSearch.getProductSearchHits(), apiProductSearch.count);
            pagingModel.setStart(pageStart);
            pagingModel.setPageSize(pageSize);

            var totalProductCount = pagingModel.count;

            if (pageStart + pageSize > totalProductCount) {
                showMoreButton = false;
            }

            moreUrl = URLUtils.url('Product-ShowBonusProducts', 'DUUID', duuid, 'pagesize', pageSize, 'pagestart', pageStart + pageSize).toString();

            var iter = pagingModel.pageElements;
            while (iter !== null && iter.hasNext()) {
                productSearchHit = iter.next();
                product = ProductFactory.get({ pid: productSearchHit.getProduct().ID, pview: 'bonus', duuid: duuid });
                products.push(product);
            }
        }
    }

    var context = {
        products: products,
        selectedBonusProducts: selectedBonusProducts,
        maxPids: req.querystring.maxpids,
        moreUrl: moreUrl,
        showMoreButton: showMoreButton,
        closeButtonText: Resource.msg('link.choice.of.bonus.dialog.close', 'product', null),
        enterDialogMessage: Resource.msg('msg.enter.choice.of.bonus.select.products', 'product', null),
        template: 'product/components/choiceOfBonusProducts/bonusProducts.isml',
        initialAddBonusProductUrl: initialAddBonusProductUrl,
        initialAddBonusProduct: initialAddBonusProduct
    };

    res.setViewData(context);

    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();

        res.json({
            renderedTemplate: renderTemplateHelper.getRenderedHtml(viewData, viewData.template)
        });
    });

    next();
});

module.exports = server.exports();
