'use strict';

var $ = require('jquery');

function InfiniteScroll(element, scrollableViewport) {
    this._$viewport = $(scrollableViewport);
    this._$element = $(element);
    this._isLoading = false;
    this._disabled = false;
    this._timeoutDelay = 50;
}

InfiniteScroll.prototype.onInfinite = function (callback) {
    var t = this;
    var timeoutId;
    var $viewport = t._$viewport;
    var element = t._$element[0];
    $viewport.on('scroll', function () {
        timeoutId = setTimeout(function () {
            clearTimeout(timeoutId);
            if (!t._disabled && !t._isLoading && t.isElementInViewport(element, $viewport[0])) {
                t._isLoading = true;
                callback(); // eslint-disable-line
            }
        }, t._timeoutDelay);
    });
};

InfiniteScroll.prototype.infiniteScrollDone = function () {
    this._isLoading = false;
};

InfiniteScroll.prototype.disable = function () {
    this._disabled = true;
};

InfiniteScroll.prototype.enable = function () {
    this._disabled = false;
};

InfiniteScroll.prototype.isElementInViewport = function (el, vp) {
    var vpRect = vp.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();
    return (
        elRect.top >= vpRect.top &&
        elRect.left >= vpRect.left &&
        elRect.bottom <= vpRect.bottom &&
        elRect.right <= vpRect.right
    );
};

module.exports = InfiniteScroll;
