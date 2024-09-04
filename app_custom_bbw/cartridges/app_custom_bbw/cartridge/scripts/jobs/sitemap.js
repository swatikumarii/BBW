'use strict';

var File = require('dw/io/File');
var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var FileWriter = require('dw/io/FileWriter');
var ProductMgr = require('dw/catalog/ProductMgr');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var SiteMapMgr = require('dw/sitemap/SitemapMgr');
var Site = require('dw/system/Site');

/**
 * @description This function returns date in ISO8601 string format.
 * @param {object} date - A string param
 * @returns {string} date in string format.
 */
function formatToISO8601(date) {
    // Get the components of the date
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    // Format the date and time components into ISO 8601 string
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+00:00`;
}

/**
 * @description This function creates google feed csv file and save it to library.
 */
function createProductSitemap() {
    var currentSite = require('dw/system/Site').getCurrent();
    var ImageModel = require('*/cartridge/models/product/productImages');
    var productValidationHelpers = require('*/cartridge/scripts/helpers/productValidationHelpers');
    var fileName = 'customProductSiteMap';
    var outputFile = new File(
        File.LIBRARIES +
            '/' +
            currentSite.ID +
            '/default/feeds/' +
            fileName +
            '.xml'
    );
    var fileWriter = new FileWriter(outputFile);
    var xmlStreamWriter = new XMLStreamWriter(fileWriter);
    xmlStreamWriter.writeStartDocument();
    xmlStreamWriter.writeStartElement('urlset');
    xmlStreamWriter.writeAttribute(
        'xmlns',
        'http://www.sitemaps.org/schemas/sitemap/0.9'
    );
    xmlStreamWriter.writeAttribute(
        'xmlns:image',
        'http://www.google.com/schemas/sitemap-image/1.1'
    );
    xmlStreamWriter.writeAttribute(
        'xmlns:xhtml',
        'http://www.w3.org/1999/xhtml'
    );
    xmlStreamWriter.writeAttribute(
        'xmlns:xsi',
        'http://www.w3.org/2001/XMLSchema-instance'
    );
    xmlStreamWriter.writeAttribute(
        'xsi:schemaLocation',
        'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd http://www.google.com/schemas/sitemap-image/1.1 http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd http://www.w3.org/1999/xhtml http://www.w3.org/2002/08/xhtml/xhtml1-strict.xsd'
    );
    var product;
    var config = {
        types: ['mediumLarge'],
        quantity: 'all'
    };
    var apiProduct;
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
                    if (
                        !product.custom.isBonusProduct &&
                        product.online &&
                        productValidationHelpers.getProductMaxOrderQty(
                            apiProduct
                        ) >= 1
                    ) {
                        xmlStreamWriter.writeStartElement('url');
                        xmlStreamWriter.writeStartElement('loc');
                        xmlStreamWriter.writeCharacters(
                            URLUtils.abs(
                                'Product-Show',
                                'pid',
                                product.ID
                            ).toString()
                        );
                        xmlStreamWriter.writeEndElement();
                        xmlStreamWriter.writeStartElement('lastmod');
                        xmlStreamWriter.writeCharacters(
                            formatToISO8601(apiProduct.lastModified)
                        );
                        xmlStreamWriter.writeEndElement();
                        xmlStreamWriter.writeStartElement('changefreq');
                        xmlStreamWriter.writeCharacters('daily');
                        xmlStreamWriter.writeEndElement();
                        xmlStreamWriter.writeStartElement('priority');
                        xmlStreamWriter.writeCharacters('1.0');
                        xmlStreamWriter.writeEndElement();
    
                        var images = new ImageModel(apiProduct, config);
                        xmlStreamWriter.writeStartElement('image:image');
                        xmlStreamWriter.writeStartElement('image:loc');
                        xmlStreamWriter.writeCharacters(
                            images.mediumLarge.length > 0
                                ? images.mediumLarge[0].absURL.toString()
                                : ''
                        );
                        xmlStreamWriter.writeEndElement();
                        xmlStreamWriter.writeStartElement('image:caption');
                        xmlStreamWriter.writeCharacters(
                            images.mediumLarge.length > 0
                                ? images.mediumLarge[0].alt
                                : ''
                        );
                        xmlStreamWriter.writeEndElement();
                        xmlStreamWriter.writeStartElement('image:title');
                        xmlStreamWriter.writeCharacters(
                            images.mediumLarge.length > 0
                                ? images.mediumLarge[0].title
                                : ''
                        );
                        xmlStreamWriter.writeEndElement();
                        // image:image end
                        xmlStreamWriter.writeEndElement();
                        // url end
                        xmlStreamWriter.writeEndElement();
                    }
                }
            }
        }
        // urlset end
        xmlStreamWriter.writeEndElement();
        xmlStreamWriter.writeEndDocument();
        xmlStreamWriter.close();
        fileWriter.close();
    } catch (err) {
        Logger.getLogger('sitemap', 'CreateProductSiteMap').error(
            'Error when creating CreateProductSiteMap' + err
        );
        productsIterator.close();
        xmlStreamWriter.close();
        fileWriter.close();
    }
    var customProductSitemapFile = new File(
        File.LIBRARIES +
            '/' +
            currentSite.ID +
            '/default/feeds/' +
            fileName +
            '.xml'
    );
    SiteMapMgr.deleteCustomSitemapFiles();
    SiteMapMgr.addCustomSitemapFile(
        Site.getCurrent().getHttpsHostName(),
        customProductSitemapFile
    );
    
}

module.exports = {
    createProductSitemap: createProductSitemap
};
