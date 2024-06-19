'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');
var Site = require('dw/system/Site');

/**
 * Render logic for the storepage.
 * @param {dw.experience.PageScriptContext} context The page script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commcerce Cloud Plattform.
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = modelIn || new HashMap();
    // Metadata similar to that used by regular SFRA pages
    // Similar to /cartridges/modules/server/route.js getPageMetadata
    model.action = 'Page-Show'; // Relative URL to the current page

    var page = context.page;
    model.page = page;
    model.content = context.content;

    var homePage = Site.current.getCustomPreferenceValue('pageDesignerID');
    if (model && model.page && model.page.ID && model.page.ID !== homePage) {
        model.queryString = 'cid=' + model.page.ID;
    } else {
        model.isHomePage = true;
    }
    // automatically register configured regions
    model.regions = PageRenderHelper.getRegionModelRegistry(page);

    if (PageRenderHelper.isInEditMode()) {
        var HookManager = require('dw/system/HookMgr');
        HookManager.callHook('app.experience.editmode', 'editmode');
        model.resetEditPDMode = true;
    }

    model.CurrentPageMetaData = PageRenderHelper.getPageMetaData(page);
    if (model && model.page && model.page.ID) {
        var ContentMgr = require('dw/content/ContentMgr');
        var contentAsset = ContentMgr.getContent(model.page.ID + '.seo');
        // As the content asset is mainly used for SEO purpose, no need to put it online
        if (
            !empty(contentAsset) &&
            'image' in contentAsset.custom &&
            'absURL' in contentAsset.custom.image
        ) {
            model.image = contentAsset.custom.image.absURL;
        }
    }
    // no pagecache setting here, this is dynamically determined by the components used within the page

    // render the page
    return new Template('experience/pages/storePage').render(model).text;
};
