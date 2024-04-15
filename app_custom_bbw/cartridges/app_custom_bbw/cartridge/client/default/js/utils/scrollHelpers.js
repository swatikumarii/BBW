var roundedTop = 0;
var i = false;

module.exports = {
    enableScroll: function validateATextbox() {
        $('body').removeAttr('style').removeClass('no-scroll');
        $('html').removeAttr('style');
        i = false;
        if (roundedTop !== 0) {
            $(window).scrollTop(roundedTop);
            i = false;
            roundedTop = 0;
        }
    },
    argenableScroll: function validateATextbox(t) {
        $('body').removeAttr('style').removeClass('no-scroll');
        $('html').removeAttr('style');
        if (t !== 0) {
            $(window).scrollTop(t);
            i = false;
            roundedTop = 0;
        }
    },
    argdisableScroll: function openExtUi(t) {
        if (t === false) {
            roundedTop = $(window).scrollTop();
            $('body').css({
                top: -roundedTop + 'px'
            }).addClass('no-scroll');
            $('html').css({
                height: '100vh'
            });
            i = true;
        }
    },
    disableScroll: function openExtUi() {
        if (!i) {
            roundedTop = $(window).scrollTop();
            $('body').css({
                top: -roundedTop + 'px'
            }).addClass('no-scroll');
            $('html').css({
                height: '100vh'
            });
            i = true;
        }
    },
    enableScrollEventsOnEl: function unbindKeypress(el) {
        $(el).off('wheel.helpers mousewheel.helpers touchmove.helpers');
        $(document).off('keydown.helpers');
    },
    disableScrollEventsOnEl: function bindKeyUpDown(e) {
        $(e).on('wheel.helpers mousewheel.helpers touchmove.helpers', function (event) {
            event.preventDefault();
            return false;
        });
        $(document).on('keydown.helpers', function (event) {
            if ({
                32: 1,
                33: 1,
                34: 1,
                35: 1,
                36: 1,
                38: 1,
                40: 1
            } [event.keyCode]) {
                event.preventDefault();
                return false;
            }
            return undefined;
        });
    },
    smoothScroll: function smoothScroll(options) {
        var scrollHeight = $('header.header').outerHeight();
        $('html, body').animate({
            scrollTop: options - scrollHeight
        }, 500);
    },
    /**
     * Initializes draggable scrolling on elements with the class 'ds-smooth-scroll'.
     */
    /* eslint-disable no-underscore-dangle */
    dragScroll: function initDragScroll() {
        $('.ds-smooth-scroll').each(function () {
            var $element = $(this);
            var isTrackingRight = false;
            var isTrackingLeft = false;
            var startScrollLeft = 0;
            var startX = 0;
            var slidingClass = 'ds-sliding';
            var container = $element.data('allowContinuedScroll') ? $('body') : $element;
            var tiles = $element.find('.ds-smooth-scroll-tile');

            /**
             * Handle mouse move events to compute new scroll position.
             * @param {Event} event - The mousemove event object.
             */
            function handleMouseMove(event) {
                event.preventDefault();
                var mouseX = event.pageX - $element.offset().left;
                var deltaX = 2.5 * (mouseX - startX);
                $element.scrollLeft(startScrollLeft - deltaX);
                if (!$element.hasClass(slidingClass) && Math.abs(mouseX - startX) > 5) {
                    $element.addClass(slidingClass);
                }
            }

            /**
             * Stops tracking mouse events on the element.
             */
            function stopTracking() {
                container.off('mouseleave mouseup', stopTracking);
                container.off('mousemove', handleMouseMove);
            }

            $element.on('mousedown', function (event) {
                startX = event.pageX - $element.offset().left;
                startScrollLeft = $element.scrollLeft();
                $element.removeClass(slidingClass);
                container.on('mouseleave mouseup', stopTracking);
                container.on('mousemove', handleMouseMove);
            });

            tiles.on('click', function (event) {
                if ($element.hasClass(slidingClass)) {
                    event.preventDefault();
                }
            });

            $element.on('mousewheel', function (event) {
                var scrollWidth = $element[0].scrollWidth - $element[0].offsetWidth;
                var newScrollLeft = $element.scrollLeft() + event.deltaX;
                if (newScrollLeft < 0 || newScrollLeft > scrollWidth) {
                    event.preventDefault();
                    $element.scrollLeft(Math.max(0, Math.min(scrollWidth, newScrollLeft)));
                }
            });

            /**
             * Tracking mouse events on the element.
             */
            function trackScrollDirection() {
                var direction = '';
                if (!isTrackingRight && startScrollLeft < $element.scrollLeft()) {
                    isTrackingRight = true;
                    direction = 'right';
                }
                if (!isTrackingLeft && startScrollLeft > $element.scrollLeft()) {
                    isTrackingLeft = true;
                    direction = 'left';
                }
                if (direction && window._satellite && window._satellite.track) {
                    window._satellite.track('smooth-scroll', {
                        moduleName: $element.data('analyticsModuleName'),
                        direction: direction
                    });
                }
                if (isTrackingRight && isTrackingLeft) {
                    $element.off('scroll', trackScrollDirection);
                }
            }

            if ($element.data('analyticsModuleName')) {
                $element.on('scroll', trackScrollDirection);
            }

            if ($element[0].scrollWidth > $element.innerWidth()) {
                $element.addClass('ds-smooth-scroll-grab');
            }
        });
    }
    /* eslint-enable no-underscore-dangle */
};
