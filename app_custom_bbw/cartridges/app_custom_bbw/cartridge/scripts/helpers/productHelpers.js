'use strict';


var base = module.superModule;

/**
 * Generates a map of string resources for the template
 * @returns {object} - String resource map
 */
function getResources() {
    var Resource = require('dw/web/Resource');

    return {
        // eslint-disable-next-line camelcase
        info_selectforstock: Resource.msg(
            'info.selectforstock',
            'product',
            'Select Styles for Availability'
        ),
        assistiveSelectedText: Resource.msg('msg.assistive.selected.text', 'common', null)
    };
}

/**
 * Creates the breadcrumbs object
 * @param {string} cgid - category ID from navigation and search
 * @param {string} pid - product ID
 * @param {Array} breadcrumbs - array of breadcrumbs object
 * @returns {Array} an array of breadcrumb objects
 */
function getAllBreadcrumbs(cgid, pid, breadcrumbs) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');

    var category;
    var product;
    if (pid) {
        product = ProductMgr.getProduct(pid);
        category = product.variant
            ? product.masterProduct.primaryCategory
            : product.primaryCategory;
    } else if (cgid) {
        category = CatalogMgr.getCategory(cgid);
    }

    if (category) {
        if(category.custom.alternativeUrl && category.custom.alternativeUrl !== '') {
            breadcrumbs.push({
                htmlValue: category.displayName,
                url: category.custom.alternativeUrl
            });
        } else {
            breadcrumbs.push({
                htmlValue: category.displayName,
                url: URLUtils.url('Search-Show', 'cgid', category.ID)
            });
        }
        if (category.parent && category.parent.ID !== 'root') {
            return getAllBreadcrumbs(category.parent.ID, null, breadcrumbs);
        }
        breadcrumbs.push({
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        });
    }
    
    return breadcrumbs;
}

/**
 * Renders the Product Details Page
 * @param {object} querystring - query string parameters
 * @param {object} reqPageMetaData - request pageMetaData object
 * @returns {object} contain information needed to render the product page
 */
function showProductPage(querystring, reqPageMetaData) {
    var URLUtils = require('dw/web/URLUtils');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    var params = querystring;
    var product = ProductFactory.get(params);
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var canonicalUrl = URLUtils.url('Product-Show', 'pid', product.id);
    var cgid = querystring && querystring.cgid ? querystring.cgid : null;
    var breadcrumbs = getAllBreadcrumbs(cgid, cgid ? null : product.id, []).reverse();
    var productName = product.fragranceName ? product.fragranceName : product.productName;
    if (breadcrumbs && breadcrumbs.length) {
        breadcrumbs.push({
            htmlValue: productName,
            url: URLUtils.url('Product-Show', 'pid', product.id)
        });
    }

    var template = 'product/productDetails';
    if (product && 'isEgiftCard' in product && product.isEgiftCard) {
        template = 'giftcard/details';
    } else if (product.productType === 'bundle' && !product.template) {
        template = 'product/bundleDetails';
    } else if (product.productType === 'set' && !product.template) {
        template = 'product/setDetails';
    } else if (product.template) {
        template = product.template;
    }

    pageMetaHelper.setPageMetaData(reqPageMetaData, product);
    pageMetaHelper.setPageMetaTags(reqPageMetaData, product);
    var schemaData = require('*/cartridge/scripts/helpers/structuredDataHelper').getProductSchema(product);

    return {
        template: template,
        product: product,
        addToCartUrl: addToCartUrl,
        resources: getResources(),
        breadcrumbs: breadcrumbs,
        canonicalUrl: canonicalUrl,
        schemaData: schemaData
    };
}

module.exports = {
    showProductPage: showProductPage,
    getAllBreadcrumbs: getAllBreadcrumbs
};

Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
