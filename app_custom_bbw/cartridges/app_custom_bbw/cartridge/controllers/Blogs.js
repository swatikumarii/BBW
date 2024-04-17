'use strict';

var ContentMgr = require('dw/content/ContentMgr');
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
});

module.exports = server.exports();
