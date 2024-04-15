var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Render logic for the html editor.
 * @param {dw.experience.PageScriptContext} context The page context
 * @returns {string} The rendered template
 */
module.exports.render = function (context) {
    var model = new HashMap();
    // var { content } = context;
    var content = context.content;

    model.html = content.html;

    return new Template('experience/components/commerce_assets/html').render(model).text;
};
