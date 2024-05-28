'use strict';

var ContentMgr = require('dw/content/ContentMgr');
var seo = require('*/cartridge/scripts/middleware/seo');

/**
 * @namespace Blogs
 */

var server = require('server');

/**
 * @name Blogs-Show
 * @function
 * @memberof Blogs
 */
server.get('Show', function (req, res, next) {
    var blog = ContentMgr.getFolder('Blogs');
    res.render('blogs/blogs', {
        blog: blog,
    });

    next();
},seo.addCurrentPageMetaData);

module.exports = server.exports();
