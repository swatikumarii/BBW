'use strict';

var base = module.superModule;

/**
 * Return an object containing the scaled image for mobile, table and desktop.  Other included image details
 * are: alt text, focalPoint x, focalPoint y.
 * @param {Image} image the image for which to be scaled.
 * @returns {object} The Absolute url
 */
base.getScaledImage = function (image) {
    return {
        src: {
            mobile: base.url(image, { device: 'mobile' }),
            tablet: base.url(image, { device: 'tablet' }),
            desktop: base.url(image, { device: 'desktop' }),
            mobile2x: base.url(image, { device: 'mobile2x' }),
            tablet2x: base.url(image, { device: 'tablet2x' }),
            desktop2x: base.url(image, { device: 'desktop2x' })
        },
        alt: image.file.getAlt(),
        focalPointX: image.focalPoint.x * 100 + '%',
        focalPointY: image.focalPoint.y * 100 + '%'
    };
};

module.exports = base;
