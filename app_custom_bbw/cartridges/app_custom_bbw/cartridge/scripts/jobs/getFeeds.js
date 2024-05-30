'use strict';

var File = require('dw/io/File');
var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var FileWriter = require('dw/io/FileWriter');
var StringUtils = require('dw/util/StringUtils');
var ProductMgr = require('dw/catalog/ProductMgr');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');

/**
 * @description This function creates google feed csv file and save it to library.
 */
function getGoogleFeeds() {
    var currentSite = require('dw/system/Site').getCurrent();
    var productsIterator = ProductMgr.queryAllSiteProducts();
    var fileName = 'google-feed';
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
            var badgeString = '';
            badgeString += 'badge1' in product.custom ? product.custom.badge1 : '';
            if ('badge2' in product.custom) {
                if (badgeString === '') {
                    badgeString += product.custom.badge2;
                } else {
                    badgeString += '|' + product.custom.badge2;
                }
            }
            if ('badge3' in product.custom) {
                if (badgeString === '') {
                    badgeString += product.custom.badge3;
                } else {
                    badgeString += '|' + product.custom.badge3;
                }
            }
            var data = {
                'Product ID': product.ID,
                SKU: product.ID,
                Name: StringUtils.decodeString(product.name, 0).replace(
                    ',',
                    ' '
                ),
                'Product URL': URLUtils.abs('Product-Show', 'pid', product.ID),
                Price: product.priceModel.price.value,
                'Retail Price': product.priceModel.price.value,
                'Thumbnail URL':
                    product.getImages('large').length > 0
                        ? product.getImages('large')[0].absURL.toString()
                        : '',
                Description: product.longDescription
                    ? StringUtils.decodeString(
                        product.longDescription.toString(),
                        0
                    ).replace(',', ' ')
                    : '',
                Brand: product.brand,
                Badges: badgeString,
                'Inventory Count':
                    product.availabilityModel.inventoryRecord &&
                    product.availabilityModel.inventoryRecord.ATS
                        ? product.availabilityModel.inventoryRecord.ATS
                        : 1000
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
            'Error when creating Google Feeds' + err
        );
        productsIterator.close();
        csvStreamWriter.close();
        csvFileWriter.close();
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
                title: product.name,
                description: product.longDescription
                    ? StringUtils.decodeString(
                        product.longDescription.toString(),
                        0
                    )
                    : '',
                link: URLUtils.abs('Product-Show', 'pid', product.ID),
                price: product.priceModel.price.value,
                // eslint-disable-next-line camelcase
                image_link:
                    product.getImages('large').length > 1
                        ? product.getImages('large')[0].absURL.toString()
                        : '',
                brand: product.brand,
                availability:
                    product.availabilityModel.inventoryRecord &&
                    product.availabilityModel.inventoryRecord.ATS
                        ? product.availabilityModel.inventoryRecord.ATS
                        : 1000,
                condition:'new'
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
