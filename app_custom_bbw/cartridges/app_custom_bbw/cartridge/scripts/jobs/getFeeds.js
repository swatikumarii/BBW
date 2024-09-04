'use strict';

var File = require('dw/io/File');
var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var FileWriter = require('dw/io/FileWriter');
var StringUtils = require('dw/util/StringUtils');
var ProductMgr = require('dw/catalog/ProductMgr');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');

/**
 * @description This function creates google feed csv file and save it to library.
 */
function getGoogleFeeds() {
    var Resource = require('dw/web/Resource');
    var currentSite = require('dw/system/Site').getCurrent();
    var ImageModel = require('*/cartridge/models/product/productImages');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var productValidationHelpers = require('*/cartridge/scripts/helpers/productValidationHelpers');
    var fileName = 'google-feed';
    var outputFile = new File(
        File.LIBRARIES + '/' + currentSite.ID + '/default/feeds/' + fileName + '.xml'
    );
    var fileWriter = new FileWriter(outputFile);
    var xmlStreamWriter = new XMLStreamWriter(fileWriter);
    xmlStreamWriter.writeStartDocument();
    xmlStreamWriter.writeStartElement('rss');
    xmlStreamWriter.writeAttribute('xmlns:g', 'http://base.google.com/ns/1.0');
    xmlStreamWriter.writeAttribute('version', '2.0');
    xmlStreamWriter.writeStartElement('channel');
    var product;
    var breadcrumbs;
    var category = '';
    var categories = '';
    var config = {
        types: ['mediumLarge'],
        quantity: 'all'
    };
    var apiProduct;
    var productObj;
    var productsIterator;
    try {
        for (var index = 0; index < currentSite.allowedLocales.length; index++) {
            var locale = currentSite.allowedLocales[index];
            if (locale !== 'default') {
                request.setLocale(locale);
                productsIterator = ProductMgr.queryAllSiteProducts();
                while (productsIterator.hasNext()) {
                    product = productsIterator.next();
                    apiProduct = ProductMgr.getProduct(product.ID);
                    productObj = ProductFactory.get({ pid: product.ID });
                    if (!product.custom.isBonusProduct && product.online && productValidationHelpers.getProductMaxOrderQty(apiProduct) >= 1) {
                        xmlStreamWriter.writeStartElement('item');
                        var images = new ImageModel(apiProduct, config);
                        breadcrumbs = '';
                        categories = '';
                        if (product.categories.length) {
                            category = product.categories[0].displayName;
                            breadcrumbs = productHelper.getAllBreadcrumbs(
                                product.categories[0].ID,
                                null,
                                []
                            );
                            breadcrumbs.push({
                                htmlValue: Resource.msg('global.home', 'common', null),
                                url: URLUtils.home().toString()
                            });
                            breadcrumbs = breadcrumbs.reverse();
                            for (var index1 = 0; index1 < breadcrumbs.length; index1++) {
                                if (
                                    index1 > 1 &&
                                    breadcrumbs[index1].htmlValue === 'Home'
                                ) {
                                    break;
                                }
                                if (index1 !== 0) {
                                    categories += ' > ';
                                }
                                categories += breadcrumbs[index1].htmlValue;
                            }
                        }
                        xmlStreamWriter.writeStartElement('item_group_id');
                        xmlStreamWriter.writeCData('');
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:title');
                        xmlStreamWriter.writeCData(
                            ' ' +
                                StringUtils.decodeString(
                                    product.name ? product.name : '',
                                    0
                                ) +
                                ' '
                        );
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:description');
                        xmlStreamWriter.writeCData(
                            product.longDescription
                                ? ' ' +
                                      StringUtils.decodeString(
                                          product.longDescription.toString(),
                                          0
                                      ) +
                                      ' '
                                : ''
                        );
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:link');
                        xmlStreamWriter.writeCData(
                            ' ' +
                                URLUtils.abs(
                                    'Product-Show',
                                    'pid',
                                    product.ID
                                ).toString() +
                                ' '
                        );
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:condition');
                        xmlStreamWriter.writeCharacters(' New ');
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:size_type');
                        xmlStreamWriter.writeCData('');
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:brand');
                        xmlStreamWriter.writeCData(
                            product.brand ? ' ' + product.brand + ' ' : ' '
                        );
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:image_link');
                        xmlStreamWriter.writeCData(
                            images.mediumLarge.length > 0
                                ? ' ' + images.mediumLarge[0].absURL.toString() + ' '
                                : ' '
                        );
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:product_type');
                        xmlStreamWriter.writeCData(' ' + categories + ' ');
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:gtin');
                        xmlStreamWriter.writeCharacters(product.UPC ? product.UPC : '');
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:shipping_weight');
                        xmlStreamWriter.writeCharacters('0');
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:availability');
                        xmlStreamWriter.writeCData(' in stock ');
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:id');
                        xmlStreamWriter.writeCData(' ' + product.ID + ' ');
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:quantity');
                        xmlStreamWriter.writeCData(productObj.availableToSell.toString());
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:price');
                        xmlStreamWriter.writeCharacters(
                            product.priceModel.price.value.toString()
                        );
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:sale_price');
                        if (productObj.promoPrice) {
                            xmlStreamWriter.writeCharacters(
                                productObj.promoPrice.toString()
                            );
                        } else {
                            xmlStreamWriter.writeCharacters(
                                product.priceModel.price.value.toString()
                            );
                        }
                        xmlStreamWriter.writeEndElement();
        
                        xmlStreamWriter.writeStartElement('g:google_product_category');
                        xmlStreamWriter.writeCData(
                            ' Health & Beauty > Personal Care > Cosmetics > Bath & Body > ' +
                                category +
                                ' '
                        );
                        xmlStreamWriter.writeEndElement();
                        // item end
                        xmlStreamWriter.writeEndElement();
                    }
                }
            }
        }
        // channel end
        xmlStreamWriter.writeEndElement();
        // rss end
        xmlStreamWriter.writeEndElement();
        xmlStreamWriter.writeEndDocument();

        xmlStreamWriter.close();
        fileWriter.close();
    } catch (err) {
        Logger.getLogger('SocialFeeds', 'SocialFeeds').error(
            'Error when creating Google Feeds' + err
        );
        productsIterator.close();
        xmlStreamWriter.close();
        fileWriter.close();
    }
}

/**
 * @description This function creates facebook feed csv file and save it to library.
 */
function getFacebookFeeds() {
    var currentSite = require('dw/system/Site').getCurrent();
    var productsIterator = ProductMgr.queryAllSiteProducts();
    var fileName = 'facebook-feed';
    var outputFile = new File(
        File.LIBRARIES + '/' + currentSite.ID + '/default/feeds/' + fileName + '.csv'
    );
    var csvFileWriter = new FileWriter(outputFile);
    var csvStreamWriter = new CSVStreamWriter(csvFileWriter, ',');
    var product;
    var objects = [];
    try {
        while (productsIterator.hasNext()) {
            product = productsIterator.next();
            var data = {
                id: product.ID,
                title: StringUtils.decodeString(product.name, 0).replace(
                    ',',
                    ' '
                ),
                description: product.longDescription
                    ? StringUtils.decodeString(
                        product.longDescription.toString(),
                        0
                    ).replace(',', ' ')
                    : '',
                link: URLUtils.abs('Product-Show', 'pid', product.ID),
                price: product.priceModel.price.value,
                // eslint-disable-next-line camelcase
                image_link:
                    product.getImages('mediumLarge').length > 0
                        ? product.getImages('mediumLarge')[0].absURL.toString()
                        : '',
                brand: product.brand,
                availability:
                    product.availabilityModel.inventoryRecord &&
                    product.availabilityModel.inventoryRecord.ATS
                        ? product.availabilityModel.inventoryRecord.ATS
                        : 1000,
                condition: 'new'
            };
            objects.push(data);
        }
        var csvHeader = Object.keys(objects[0]);
        csvStreamWriter.writeNext(csvHeader);
        objects.forEach(function (element) {
            var csvData = [];
            csvHeader.forEach(function (prop) {
                csvData.push(element[prop] ? element[prop] : '');
            });
            csvStreamWriter.writeNext(csvData);
        });
        csvStreamWriter.close();
        csvFileWriter.close();
    } catch (err) {
        Logger.getLogger('SocialFeeds', 'SocialFeeds').error(
            'Error when creating Facebook Feeds' + err
        );
        productsIterator.close();
        csvStreamWriter.close();
        csvFileWriter.close();
    }
}

module.exports = {
    getGoogleFeeds: getGoogleFeeds,
    getFacebookFeeds: getFacebookFeeds
};
