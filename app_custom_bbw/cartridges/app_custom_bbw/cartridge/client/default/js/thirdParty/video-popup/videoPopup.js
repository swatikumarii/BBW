'use strict';

// Video POP UP
var ModalVideo = require('modal-video/js/modal-video');
// eslint-disable-next-line no-new
new ModalVideo('.js-modal-btn');
// eslint-disable-next-line no-new
new ModalVideo('.js-vimeo-modal-btn', { channel: 'vimeo' });
// eslint-disable-next-line no-new
new ModalVideo('.js-youtube-modal-btn', {
    youtube: {
        controls: 1,
        nocookie: true,
        autoplay: 1,
        loop: 1,
        rel: 0
    },
    channel: 'youtube'
});
