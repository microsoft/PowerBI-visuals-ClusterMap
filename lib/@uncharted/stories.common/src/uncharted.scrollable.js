'use strict';

var $ = require('jquery');

var Scrollable = function Scrollable($container, options) {
    var t = this;
    var defaults = {
        sliderSelector: null,
        viewportSelector: null,
    };
    t.options = $.extend({}, defaults, options);

    t._slideStart = null;
    t._initialScrollPosition = null;
    t._isScrolling = false;
    t._scrollEnabled = true;
    t.$container = $container;

    if (!t.options.sliderSelector) throw new Error('A Slider Selector must be specified.');
    t.$slider = $(t.options.sliderSelector);
    if (!t.options.viewportSelector) throw new Error('A Viewport Selector must be specified.');
    t.$target = $(t.options.viewportSelector);

    var updateReadingModeScrollPosition = function (targetScrollPosition) {
        // Amount of Scrollable Distance
        var readingMaxScroll = t.$target.children().outerHeight(true) - t.$target.height();

        var readingMaxSlide = t.$container.height() - t.$slider.height();

        var slideRatio = targetScrollPosition / readingMaxSlide;
        // // determine slide position
        var scrollPosition = readingMaxScroll * slideRatio;

        // update slider
        t.$target.scrollTop(scrollPosition);
    };

    var onContainerMouseDown = function (e) {
        t._isScrolling = true;
        t._slideStart = e.pageY;
        t._initialScrollPosition = t.$slider.position().top;
    };

    var onContainerMouseMove = function (e) {
        // if the mouse button is compressed
        if (t._isScrolling && e.buttons === 1) {
            var delta = e.pageY - t._slideStart;
            var maxHeight = t.$container.height() - t.$slider.height();
            var position = (t._initialScrollPosition || 0) + delta;

            if (position < 0) {
                position = 0;
            } else if (position > maxHeight) {
                position = maxHeight;
            }
            updateReadingModeScrollPosition(position);
        }
    };

    var onContainerMouseUp = function () {
        t._isScrolling = false;
        t._slideStart = null;
        t._initialScrollPosition = null;
    };

    var updateReadingModeSliderPosition = function () {
        // Ratio of scroll content to viewport
        var readingSliderRatio = t.$target.height() / t.$target.children().outerHeight(true);
        // Amount of Scrollable Distance
        var readingMaxScroll = t.$target.children().outerHeight(true) - t.$target.height();
        // current state of the scroll
        var scrollRatio = t.$target.scrollTop() / readingMaxScroll;
        // amount of slide room
        var slideRoom = (1 - readingSliderRatio) * t.$container.height();

        // determine slide position
        var slidePosition = slideRoom * scrollRatio;

        // update slider
        t.$slider.css({top: slidePosition});
    };

    var dispose = function () {
        t.$container
            .off('mousedown', t.options.sliderSelector, onContainerMouseDown)
            .off('mousemove', onContainerMouseMove)
            .off('mouseup', t.options.sliderSelector, onContainerMouseUp);
    };

    var init = function () {
        // assume the immediate parent is the container;
        t._scrollEnabled = t.$target.height() < t.$target.children().outerHeight(true);

        if (t._scrollEnabled) {
            t.$container
                .on('mousedown', t.options.sliderSelector, onContainerMouseDown)
                .on('mousemove', onContainerMouseMove)
                .on('mouseup', t.options.sliderSelector, onContainerMouseUp);

            t.$target.scroll($.proxy(updateReadingModeSliderPosition, t));
        } else {
            t.$slider.hide();
        }
    };

    t.Dispose = dispose;

    init();

    return t.$container;
};

module.exports = Scrollable;
module.exports.asJQueryPlugin = function () {
    $.fn.scrollable = function (options) {
        return new Scrollable(this, options);
    };
};
