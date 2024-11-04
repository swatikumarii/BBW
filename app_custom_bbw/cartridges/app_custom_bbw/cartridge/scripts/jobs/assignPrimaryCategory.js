// Import necessary modules
var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var File = require('dw/io/File');
var Pipelet = require('dw/system/Pipelet');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');


function assignPrimaryCategory() {
    var productIterator = ProductMgr.queryAllSiteProducts();
    var assignedProducts = [];
    while (productIterator.hasNext()) {
        var product = productIterator.next();
        if(!product.primaryCategory || product.primaryCategory.ID == null)
        {
            var customPrimaryCategoryID = product.custom.primaryCategoryID;
            if (customPrimaryCategoryID && customPrimaryCategoryID !== null && product.getCategoryAssignment(CatalogMgr.getCategory(customPrimaryCategoryID))) {
                assignedProducts.push({ productId: product.ID, assignedCategory: customPrimaryCategoryID });
            } else {
                // Assign the top assigned category if no custom ID
                var topCategory = product.allCategories[0];
                if (topCategory) {
                    assignedProducts.push({ productId: product.ID, assignedCategory: topCategory.ID });
                }
            }
        }
    }
    if(assignedProducts.length > 0)
    {
        var primaryCategoryFile = new File(File.IMPEX + '/src/catalog/primaryCategoryJob.xml');
        var fileWriter = new FileWriter(primaryCategoryFile);
        var xsw = new XMLStreamWriter(fileWriter);
        xsw.writeStartDocument();
        xsw.writeStartElement("catalog");
        xsw.writeAttribute('xmlns', "http://www.demandware.com/xml/impex/catalog/2006-10-31");
        xsw.writeAttribute('catalog-id', CatalogMgr.getSiteCatalog().ID);
        assignedProducts.forEach(function(assignedProduct) {
            if (assignedProduct.assignedCategory && assignedProduct.productId) {
                xsw.writeStartElement('category-assignment');
                xsw.writeAttribute('category-id', assignedProduct.assignedCategory);
                xsw.writeAttribute('product-id', assignedProduct.productId);
                xsw.writeStartElement('primary-flag');
                xsw.writeCharacters('true');
                xsw.writeEndElement();
                xsw.writeEndElement();
            }
        });
        xsw.writeEndElement();
        xsw.writeEndDocument();
        xsw.close();
        fileWriter.close();
        var importStatus = new Pipelet('ImportCatalog').execute({
            ImportFile: 'catalog/primaryCategoryJob.xml',
            ImportMode: 'MERGE'
        });
    }
}

module.exports = {
    assignPrimaryCategory: assignPrimaryCategory
};

